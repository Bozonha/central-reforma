import { sumCents, percentOf } from "./money";

export interface LinhaOrcamentoResumo {
  categoria: string;
  planejadoCent: number;
  compradoCent: number;
  pagoCent: number;
}

export interface ResumoOrcamento {
  planejadoCent: number;
  compradoCent: number;
  pagoCent: number;
  percentualComprado: number;
  percentualPago: number;
  saldoCent: number; // planejado - pago
  estourado: boolean;
  porCategoria: LinhaOrcamentoResumo[];
  /**
   * Teto informado na criação/edição da obra ("Orçamento total"). É um dado
   * independente da soma das categorias abaixo — ver `disponivelCent` e
   * `planejadoExcedeTotal` para como os dois se relacionam. `null` quando a
   * obra não definiu um teto.
   */
  orcamentoTotalCent: number | null;
  /** orcamentoTotalCent - planejadoCent. `null` quando não há teto definido. */
  disponivelCent: number | null;
  /** Percentual do teto já alocado em categorias. `null` quando não há teto definido. */
  percentualPlanejadoDoTotal: number | null;
  /** true quando a soma das categorias planejadas já ultrapassa o teto da obra. */
  planejadoExcedeTotal: boolean;
}

export function resumirOrcamento(linhas: LinhaOrcamentoResumo[], orcamentoTotalCent: number | null = null): ResumoOrcamento {
  const planejadoCent = sumCents(linhas.map((l) => l.planejadoCent));
  const compradoCent = sumCents(linhas.map((l) => l.compradoCent));
  const pagoCent = sumCents(linhas.map((l) => l.pagoCent));

  return {
    planejadoCent,
    compradoCent,
    pagoCent,
    percentualComprado: percentOf(compradoCent, planejadoCent),
    percentualPago: percentOf(pagoCent, planejadoCent),
    saldoCent: planejadoCent - pagoCent,
    estourado: pagoCent > planejadoCent && planejadoCent > 0,
    porCategoria: linhas,
    orcamentoTotalCent,
    disponivelCent: orcamentoTotalCent != null ? orcamentoTotalCent - planejadoCent : null,
    percentualPlanejadoDoTotal: orcamentoTotalCent != null ? percentOf(planejadoCent, orcamentoTotalCent) : null,
    planejadoExcedeTotal: orcamentoTotalCent != null && planejadoCent > orcamentoTotalCent,
  };
}
