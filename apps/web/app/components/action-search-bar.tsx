import { Icon } from "./icons";

/**
 * "De que você precisa?" — área de ação contextual.
 *
 * Este é apenas o placeholder visual de uma funcionalidade futura (busca de
 * ações / atalhos guiados). Não há lógica real aqui: nenhuma busca, IA ou
 * chat está implementado nesta etapa. O elemento é deliberadamente discreto
 * dentro da barra superior — um SaaS de gestão, não uma interface de chat.
 */
export function ActionSearchBar() {
  return (
    <button
      type="button"
      disabled
      title="Em breve"
      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-slate-500 transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed sm:max-w-md"
    >
      <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="truncate text-sm">De que você precisa?</span>
      <span className="ml-auto shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
        em breve
      </span>
    </button>
  );
}
