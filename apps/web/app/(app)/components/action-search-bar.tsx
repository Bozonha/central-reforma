import { Icon } from "../../components/icons";

/**
 * "De que você precisa?" — área de ação contextual. Continua sendo um
 * placeholder visual deliberado: nenhuma busca, IA ou chat está implementado
 * ainda. Mantido discreto de propósito — este é um SaaS de gestão, não uma
 * interface de chat (CLAUDE.md: "a IA aparece quando é útil, nunca domina a
 * tela").
 */
export function ActionSearchBar() {
  return (
    <button
      type="button"
      disabled
      title="Em breve"
      className="flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-left text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] disabled:cursor-not-allowed sm:max-w-md"
    >
      <Icon name="search" className="h-4 w-4 shrink-0 text-[var(--color-text-faint)]" />
      <span className="truncate text-sm">De que você precisa?</span>
      <span className="ml-auto shrink-0 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-faint)]">
        em breve
      </span>
    </button>
  );
}
