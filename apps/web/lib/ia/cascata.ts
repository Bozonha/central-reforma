import { ErroProvedorIA, type ArquivoParaAnalise, type ProvedorIA } from "./providers/types";
import { geminiFlashLite31, geminiFlashLite35, geminiFlash38 } from "./providers/gemini";
import { mistralPixtral } from "./providers/mistral";
import { groqLlama4Scout } from "./providers/groq";
import { openRouterFree } from "./providers/openrouter";

/**
 * Ordem de tentativa: 3 modelos do Gemini primeiro (do mais barato/rápido
 * para o mais robusto — cobre a grande maioria dos casos e dos erros
 * transitórios de "high demand" sozinho), depois 3 provedores redundantes
 * de terceiros. Cada entrada só é de fato usada se sua variável de
 * ambiente de chave estiver configurada — sem chave, é pulada em silêncio
 * (ver ErroProvedorIA "SEM_CHAVE" tratado em `tentarProvedor`).
 */
const CASCATA: readonly ProvedorIA[] = [
  geminiFlashLite31,
  geminiFlashLite35,
  geminiFlash38,
  mistralPixtral,
  groqLlama4Scout,
  openRouterFree,
];

const MAX_TENTATIVAS_POR_PROVEDOR = 2;
const ATRASO_ENTRE_TENTATIVAS_MS = 1500;

/** Erros considerados transitórios — vale a pena tentar o mesmo provedor de novo antes de desistir dele. */
const CODIGOS_TRANSITORIOS = new Set(["COTA_EXCEDIDA", "INDISPONIVEL"]);

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type TentativaCascata = {
  provedor: string;
  sucesso: boolean;
  /** Código do erro, quando não teve sucesso. Ausente quando o provedor foi pulado por falta de chave. */
  erro?: string;
};

/**
 * Erro final lançado quando TODOS os provedores da cascata falham (ou não
 * têm chave configurada). Carrega o histórico de tentativas para que o
 * chamador monte uma mensagem de erro útil para o usuário.
 */
export class TodosProvedoresFalharamError extends Error {
  constructor(public readonly tentativas: TentativaCascata[]) {
    super(`Todos os provedores de IA falharam: ${tentativas.map((t) => `${t.provedor}=${t.erro ?? "?"}`).join(", ")}`);
    this.name = "TodosProvedoresFalharamError";
  }
}

export type ResultadoCascata = {
  texto: string;
  /** Nome do provedor/modelo que respondeu com sucesso — vira proveniência no resultado salvo. */
  provedor: string;
  tentativas: TentativaCascata[];
};

/**
 * Tenta um único provedor, com retry apenas para erros transitórios
 * (cota momentânea / indisponibilidade). Erros de configuração
 * (SEM_CHAVE) ou de formato (ERRO) não são retentados — não adianta.
 */
async function tentarProvedor(
  provedor: ProvedorIA,
  arquivo: ArquivoParaAnalise,
  promptSistema: string,
  promptUsuario: string,
  tentativas: TentativaCascata[],
): Promise<string | null> {
  if (!provedor.mimesSuportados.has(arquivo.mimeType)) {
    // Não registra tentativa — não é uma falha do provedor, é um documento fora do seu escopo.
    return null;
  }

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_POR_PROVEDOR; tentativa++) {
    try {
      const texto = await provedor.analisar(arquivo, promptSistema, promptUsuario);
      tentativas.push({ provedor: provedor.nome, sucesso: true });
      return texto;
    } catch (erro) {
      const erroTipado = erro instanceof ErroProvedorIA ? erro : new ErroProvedorIA("ERRO", provedor.nome, erro instanceof Error ? erro.message : "desconhecido");

      if (erroTipado.codigo === "SEM_CHAVE") {
        // Sem chave configurada — pula silenciosamente para o próximo provedor, sem gastar retry.
        return null;
      }

      const ehTransitorio = CODIGOS_TRANSITORIOS.has(erroTipado.codigo);
      const temMaisTentativas = tentativa < MAX_TENTATIVAS_POR_PROVEDOR;

      if (ehTransitorio && temMaisTentativas) {
        await aguardar(ATRASO_ENTRE_TENTATIVAS_MS);
        continue;
      }

      tentativas.push({ provedor: provedor.nome, sucesso: false, erro: erroTipado.codigo });
      return null;
    }
  }

  return null;
}

/**
 * Orquestra a cascata completa: tenta cada provedor em ordem de
 * prioridade, com retry para erros transitórios, e pula silenciosamente
 * provedores sem chave configurada ou que não suportam o tipo de arquivo.
 * Lança `TodosProvedoresFalharamError` só se absolutamente nenhum
 * provedor conseguiu responder.
 */
export async function analisarComCascata(arquivo: ArquivoParaAnalise, promptSistema: string, promptUsuario: string): Promise<ResultadoCascata> {
  const tentativas: TentativaCascata[] = [];

  for (const provedor of CASCATA) {
    const texto = await tentarProvedor(provedor, arquivo, promptSistema, promptUsuario, tentativas);
    if (texto !== null) {
      return { texto, provedor: provedor.nome, tentativas };
    }
  }

  throw new TodosProvedoresFalharamError(tentativas);
}
