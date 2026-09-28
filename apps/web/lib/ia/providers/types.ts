/**
 * Contrato comum a qualquer provedor de IA usado na cascata de análise de
 * documentos. Cada provedor concreto (Gemini, Mistral, Groq, OpenRouter...)
 * implementa esta interface — o orquestrador (`cascata.ts`) não sabe nada
 * sobre APIs específicas, só sobre este contrato.
 */

export type CodigoErroProvedorIA =
  /** Variável de ambiente da chave não configurada no servidor. */
  | "SEM_CHAVE"
  /** Rate limit / cota gratuita esgotada (HTTP 429). */
  | "COTA_EXCEDIDA"
  /** Provedor temporariamente fora do ar / sobrecarregado (HTTP 503/502/504). */
  | "INDISPONIVEL"
  /** Qualquer outro erro (HTTP inesperado, resposta vazia, formato inválido). */
  | "ERRO";

/**
 * Erro tipado lançado por qualquer implementação de ProvedorIA. O
 * orquestrador decide o que fazer (tentar de novo, pular pro próximo
 * provedor, desistir) só olhando para `codigo` — nunca faz parsing de
 * mensagem de erro.
 */
export class ErroProvedorIA extends Error {
  constructor(
    public readonly codigo: CodigoErroProvedorIA,
    public readonly provedor: string,
    detalhe?: string,
  ) {
    super(detalhe ? `[${provedor}] ${codigo}: ${detalhe}` : `[${provedor}] ${codigo}`);
    this.name = "ErroProvedorIA";
  }
}

/** Um arquivo (imagem ou PDF) pronto para enviar a um provedor de IA. */
export type ArquivoParaAnalise = {
  base64: string;
  mimeType: string;
};

/**
 * Um provedor concreto de IA com capacidade de visão. `nome` identifica o
 * provedor/modelo nos logs e no resultado (proveniência). `mimesSuportados`
 * permite ao orquestrador pular silenciosamente um provedor que não lê PDF,
 * por exemplo, em vez de tentar e falhar.
 */
export interface ProvedorIA {
  /** Identificador curto e estável, usado em logs e na proveniência do resultado (ex.: "gemini-3.1-flash-lite"). */
  readonly nome: string;
  /** Tipos MIME que este provedor consegue processar. */
  readonly mimesSuportados: ReadonlySet<string>;
  /**
   * Executa a análise. Recebe o prompt de sistema (instruções) e o prompt
   * de usuário (pedido específico), e devolve o texto bruto da resposta —
   * o chamador é quem faz o parsing/validação do JSON.
   *
   * Deve lançar `ErroProvedorIA` para qualquer falha, nunca um Error genérico.
   */
  analisar(arquivo: ArquivoParaAnalise, promptSistema: string, promptUsuario: string): Promise<string>;
}
