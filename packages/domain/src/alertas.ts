import { percentOf } from "./money";
import type { StatusItemCompra, StatusTarefa } from "./types";

/**
 * Geração de alertas do Dashboard — extraída para cá porque é regra de
 * negócio (limiares, comparações de data), não apresentação (CLAUDE.md #3:
 * cálculo determinístico é código testável, nunca lógica solta numa página).
 * A página só deve chamar `gerarAlertas` e renderizar o resultado.
 */

export type NivelAlerta = "alto" | "medio";

export interface Alerta {
  texto: string;
  nivel: NivelAlerta;
}

export interface LinhaOrcamentoParaAlerta {
  obraId: string;
  categoria: string;
  planejadoCent: number;
  compradoCent: number;
}

export interface TarefaParaAlerta {
  obraId: string;
  titulo: string;
  status: StatusTarefa;
  fim: Date | null;
}

export interface ItemListaParaAlerta {
  obraId: string;
  status: StatusItemCompra;
  criadoEm: Date;
}

export interface GerarAlertasInput {
  linhas: LinhaOrcamentoParaAlerta[];
  tarefas: TarefaParaAlerta[];
  itensLista: ItemListaParaAlerta[];
  /** Nome da obra por id — usado para identificar a obra no texto do alerta quando há mais de uma. */
  obraNomePorId: Map<string, string>;
  /** Mostrar o nome da obra em cada alerta (só faz sentido com mais de uma obra ativa). */
  mostrarNomeObra: boolean;
  /** "Agora", injetado para o resultado ser determinístico e testável. */
  agora: Date;
}

export const LIMIAR_ORCAMENTO_ESTOURADO_PCT = 100;
export const LIMIAR_ORCAMENTO_ATENCAO_PCT = 80;
export const DIAS_ITEM_LISTA_PARADO = 5;

function sufixoObra(obraId: string, obraNomePorId: Map<string, string>, mostrarNomeObra: boolean): string {
  if (!mostrarNomeObra) return "";
  const nome = obraNomePorId.get(obraId);
  return nome ? ` (${nome})` : "";
}

/**
 * Deriva os alertas do Dashboard a partir de dados já carregados do banco —
 * nunca consulta nada, nunca "adivinha": cada alerta é uma regra fixa sobre
 * números reais (CLAUDE.md #1). Ordenado com os alertas "alto" primeiro.
 */
export function gerarAlertas(input: GerarAlertasInput): Alerta[] {
  const { linhas, tarefas, itensLista, obraNomePorId, mostrarNomeObra, agora } = input;
  const alertas: Alerta[] = [];

  for (const l of linhas) {
    if (l.planejadoCent <= 0) continue;
    const pct = percentOf(l.compradoCent, l.planejadoCent);
    const sufixo = sufixoObra(l.obraId, obraNomePorId, mostrarNomeObra);
    if (pct >= LIMIAR_ORCAMENTO_ESTOURADO_PCT) {
      alertas.push({
        texto: `Orçamento de "${l.categoria}"${sufixo} já ultrapassou o previsto (${pct}%).`,
        nivel: "alto",
      });
    } else if (pct >= LIMIAR_ORCAMENTO_ATENCAO_PCT) {
      alertas.push({
        texto: `Orçamento de "${l.categoria}"${sufixo} já usou ${pct}% do previsto.`,
        nivel: "medio",
      });
    }
  }

  for (const t of tarefas) {
    if (t.status !== "CONCLUIDA" && t.fim && t.fim < agora) {
      const sufixo = sufixoObra(t.obraId, obraNomePorId, mostrarNomeObra);
      alertas.push({
        texto: `"${t.titulo}"${sufixo} está atrasada — previsto para ${formatDataCurta(t.fim)}.`,
        nivel: "alto",
      });
    }
  }

  const limite = new Date(agora.getTime() - DIAS_ITEM_LISTA_PARADO * 24 * 60 * 60 * 1000);
  const pendentesAntigos = itensLista.filter((i) => i.status === "PENDENTE" && i.criadoEm < limite);
  if (pendentesAntigos.length > 0) {
    alertas.push({
      texto: `${pendentesAntigos.length} ${pendentesAntigos.length === 1 ? "item está pendente" : "itens estão pendentes"} na lista de compras há mais de ${DIAS_ITEM_LISTA_PARADO} dias.`,
      nivel: "medio",
    });
  }

  return alertas.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === "alto" ? -1 : 1));
}

function formatDataCurta(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
