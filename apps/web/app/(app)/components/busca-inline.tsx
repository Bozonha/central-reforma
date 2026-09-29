import { Icon } from "../../components/icons";

/**
 * Busca server-rendered simples — form GET puro, sem JS: o navegador já
 * sabe recarregar a página com `?q=...` na URL. Usado em telas com listas
 * grandes (Estoque, Cronograma) que também paginam (ver ui/pagination.tsx)
 * — a busca sempre volta para a página 1, nunca mantém `pagina` de uma
 * busca anterior.
 */
export function BuscaInline({
  obraId,
  valorAtual,
  placeholder,
  action,
}: {
  obraId: string;
  valorAtual?: string;
  placeholder: string;
  action: string;
}) {
  return (
    <form action={action} method="GET" className="flex items-center gap-2">
      <input type="hidden" name="obraId" value={obraId} />
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-faint)]" />
        <input
          type="text"
          name="q"
          defaultValue={valorAtual}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-8 pr-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-primary)] sm:w-56"
        />
      </div>
    </form>
  );
}
