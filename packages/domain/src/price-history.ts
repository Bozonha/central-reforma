/**
 * Classificação verde/amarelo/vermelho/cinza do histórico de preço
 * (docs/architecture/analise-arquitetura.md, seção 2.5 apontava que os
 * limiares precisavam ser definidos como regra determinística antes de
 * codificar — nunca deixado para um LLM "decidir na hora"). Limiares
 * definidos aqui, documentados, nunca inventados por IA em tempo de
 * execução:
 *
 *  - CINZA: menos de MIN_OBSERVACOES observações nos últimos JANELA_DIAS
 *    dias para aquele produto — dado insuficiente para qualquer comparação.
 *  - VERDE: preço no percentil 25 ou abaixo do histórico da janela (25%
 *    mais baratos observados).
 *  - AMARELO: entre o percentil 25 e 75 (faixa "normal").
 *  - VERMELHO: acima do percentil 75 (25% mais caros observados).
 *
 * Esses números (3 observações, 90 dias, p25/p75) são um ponto de partida
 * declarado — não uma verdade estatística universal — e devem ser
 * revisitados com dados reais de uso (ver docs/product/decisoes.md).
 */

export type ClassificacaoPreco = "VERDE" | "AMARELO" | "VERMELHO" | "CINZA";

export const MIN_OBSERVACOES_PARA_CLASSIFICAR = 3;
export const JANELA_DIAS_HISTORICO = 90;

export interface ObservacaoPreco {
  precoCent: number;
  capturadoEm: Date;
}

export interface ResultadoClassificacao {
  classificacao: ClassificacaoPreco;
  observacoesConsideradas: number;
  percentil25Cent: number | null;
  percentil75Cent: number | null;
  motivo: string;
}

function percentil(valoresOrdenados: number[], p: number): number {
  const primeiro = valoresOrdenados[0];
  if (primeiro === undefined) return 0;
  if (valoresOrdenados.length === 1) return primeiro;
  const idx = (p / 100) * (valoresOrdenados.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  const valorLower = valoresOrdenados[lower] ?? primeiro;
  if (lower === upper) return valorLower;
  const valorUpper = valoresOrdenados[upper] ?? valorLower;
  const fraction = idx - lower;
  return valorLower + (valorUpper - valorLower) * fraction;
}

export function classificarPreco(
  precoAtualCent: number,
  historico: ObservacaoPreco[],
  agora: Date = new Date(),
): ResultadoClassificacao {
  const limiteJanela = new Date(agora.getTime() - JANELA_DIAS_HISTORICO * 24 * 60 * 60 * 1000);
  const dentroDaJanela = historico.filter((o) => o.capturadoEm >= limiteJanela);

  if (dentroDaJanela.length < MIN_OBSERVACOES_PARA_CLASSIFICAR) {
    return {
      classificacao: "CINZA",
      observacoesConsideradas: dentroDaJanela.length,
      percentil25Cent: null,
      percentil75Cent: null,
      motivo: `Apenas ${dentroDaJanela.length} observação(ões) nos últimos ${JANELA_DIAS_HISTORICO} dias — mínimo de ${MIN_OBSERVACOES_PARA_CLASSIFICAR} para classificar.`,
    };
  }

  const precos = dentroDaJanela.map((o) => o.precoCent).sort((a, b) => a - b);
  const p25 = percentil(precos, 25);
  const p75 = percentil(precos, 75);

  let classificacao: ClassificacaoPreco;
  let motivo: string;
  if (precoAtualCent <= p25) {
    classificacao = "VERDE";
    motivo = `Preço está entre os 25% mais baixos observados (≤ P25).`;
  } else if (precoAtualCent <= p75) {
    classificacao = "AMARELO";
    motivo = `Preço está na faixa intermediária observada (entre P25 e P75).`;
  } else {
    classificacao = "VERMELHO";
    motivo = `Preço está entre os 25% mais altos observados (> P75).`;
  }

  return {
    classificacao,
    observacoesConsideradas: dentroDaJanela.length,
    percentil25Cent: Math.round(p25),
    percentil75Cent: Math.round(p75),
    motivo,
  };
}
