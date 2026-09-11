/**
 * Dinheiro é sempre armazenado como inteiro em CENTAVOS no banco (CLAUDE.md
 * #3) — nunca float. Estas são as únicas funções que devem converter entre
 * centavos e a representação de R$ usada na UI. Nenhum outro lugar do
 * código deve fazer essa conversão "na mão".
 */

export function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Converte um número em reais (ex.: input de formulário) para centavos inteiros. */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Converte uma string de formulário (aceita "1.234,56" ou "1234.56") para centavos. */
export function parseBRLToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Formato brasileiro com milhar "." e decimal ",".
  const brFormat = /^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$/;
  let normalized: string;
  if (brFormat.test(trimmed)) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = trimmed.replace(",", ".");
  }

  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return reaisToCents(parsed);
}

export function sumCents(values: Array<number | null | undefined>): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
