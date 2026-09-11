import type { StatusTarefa } from "@central-reforma/domain";

export interface TimelineTarefa {
  id: string;
  titulo: string;
  status: StatusTarefa;
  inicio: Date;
  fim: Date;
  percentualConclusao: number;
}

const STATUS_COLOR: Record<StatusTarefa, string> = {
  PENDENTE: "var(--color-neutral-status)",
  EM_ANDAMENTO: "var(--color-primary)",
  CONCLUIDA: "var(--color-good)",
  ATRASADA: "var(--color-serious)",
};

function formatCurta(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function Timeline({ tarefas }: { tarefas: TimelineTarefa[] }) {
  if (tarefas.length === 0) return null;

  const inicioMin = new Date(Math.min(...tarefas.map((t) => t.inicio.getTime())));
  const fimMax = new Date(Math.max(...tarefas.map((t) => t.fim.getTime())));
  const totalMs = Math.max(fimMax.getTime() - inicioMin.getTime(), 1000 * 60 * 60 * 24);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-[var(--color-text-faint)]">
        <span>{formatCurta(inicioMin)}</span>
        <span>{formatCurta(fimMax)}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {tarefas.map((t) => {
          const offsetPct = ((t.inicio.getTime() - inicioMin.getTime()) / totalMs) * 100;
          const widthPct = Math.max(((t.fim.getTime() - t.inicio.getTime()) / totalMs) * 100, 1.5);
          return (
            <div key={t.id} className="flex items-center gap-3">
              <p className="w-32 shrink-0 truncate text-xs text-[var(--color-text-muted)]" title={t.titulo}>
                {t.titulo}
              </p>
              <div className="relative h-5 flex-1 rounded-md bg-[var(--color-bg)]">
                <div
                  className="absolute top-0 h-5 overflow-hidden rounded-md"
                  style={{ left: `${offsetPct}%`, width: `${widthPct}%`, background: STATUS_COLOR[t.status] }}
                  title={`${t.titulo} — ${t.percentualConclusao}%`}
                >
                  {t.status === "EM_ANDAMENTO" ? (
                    <div
                      className="h-full bg-black/15"
                      style={{ width: `${100 - t.percentualConclusao}%`, marginLeft: `${t.percentualConclusao}%` }}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-faint)]">
        {(Object.keys(STATUS_COLOR) as StatusTarefa[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
            {s === "PENDENTE" ? "Pendente" : s === "EM_ANDAMENTO" ? "Em andamento" : s === "CONCLUIDA" ? "Concluída" : "Atrasada"}
          </span>
        ))}
      </div>
    </div>
  );
}
