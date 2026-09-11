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
}

export function resumirOrcamento(linhas: LinhaOrcamentoResumo[]): ResumoOrcamento {
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
  };
}
