import Link from "next/link";
import { Icon } from "../icons";

/**
 * Paginação simples "Anterior/Próxima" sem contagem total — o total exigiria
 * um COUNT(*) a mais a cada carregamento só para mostrar um número, e as
 * páginas que a gente lista (Diário, Documentos) não precisam de "pular
 * para a página 8" — precisam só não travar quando a obra tem centenas de
 * registros. `temProximaPagina` vem de buscar um registro a mais do que o
 * tamanho da página (ver uso em app/(app)/diario/page.tsx).
 */
export function Pagination({
  paginaAtual,
  temProximaPagina,
  buildHref,
}: {
  paginaAtual: number;
  temProximaPagina: boolean;
  buildHref: (pagina: number) => string;
}) {
  if (paginaAtual === 1 && !temProximaPagina) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      {paginaAtual > 1 ? (
        <Link
          href={buildHref(paginaAtual - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
        >
          <Icon name="chevron-right" className="h-3.5 w-3.5 rotate-180" />
          Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="text-xs text-[var(--color-text-faint)]">Página {paginaAtual}</span>
      {temProximaPagina ? (
        <Link
          href={buildHref(paginaAtual + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
        >
          Próxima
          <Icon name="chevron-right" className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

export function parsePagina(valor: string | undefined): number {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
