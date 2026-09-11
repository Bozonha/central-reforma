import type { FonteMedida } from "./types";

/**
 * Área de um ambiente nunca é digitada diretamente — é sempre derivada de
 * largura × comprimento (seção 6 do documento de arquitetura). Se qualquer
 * uma das duas medidas faltar, o resultado é `null` — nunca uma estimativa
 * disfarçada.
 */
export function areaAmbiente(largura: number | null, comprimento: number | null): number | null {
  if (largura == null || comprimento == null) return null;
  if (largura <= 0 || comprimento <= 0) return null;
  return Math.round(largura * comprimento * 100) / 100;
}

export function volumeAmbiente(
  largura: number | null,
  comprimento: number | null,
  altura: number | null,
): number | null {
  const area = areaAmbiente(largura, comprimento);
  if (area == null || altura == null || altura <= 0) return null;
  return Math.round(area * altura * 100) / 100;
}

/** Rótulo amigável para a proveniência de uma medida — nunca oculta a incerteza. */
export function labelFonteMedida(fonte: FonteMedida): string {
  const labels: Record<FonteMedida, string> = {
    USUARIO: "Informado por você",
    DOCUMENTO: "Extraído de documento",
    VISAO_ESTIMADA: "Estimado por IA (visão)",
    CONFIRMADA: "Confirmado",
    DESCONHECIDA: "Desconhecido",
  };
  return labels[fonte];
}
