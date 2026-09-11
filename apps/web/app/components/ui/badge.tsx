import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons";

export type BadgeTone = "good" | "warning" | "serious" | "neutral" | "primary";

const TONE_CLASSES: Record<BadgeTone, string> = {
  good: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  serious: "bg-[var(--color-serious-soft)] text-[var(--color-serious)]",
  neutral: "bg-[var(--color-neutral-status-soft)] text-[var(--color-neutral-status)]",
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {icon ? <Icon name={icon} className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}

/** Status de tarefa/item/problema — cores reservadas (nunca reaproveitadas como categoria de gráfico). */
export function statusToneMap(status: string): BadgeTone {
  const map: Record<string, BadgeTone> = {
    ATIVA: "good",
    ARQUIVADA: "neutral",
    PENDENTE: "neutral",
    EM_ANDAMENTO: "primary",
    CONCLUIDA: "good",
    ATRASADA: "serious",
    COMPRADO: "good",
    CANCELADO: "neutral",
    ABERTO: "warning",
    RESOLVIDO: "good",
    VERDE: "good",
    AMARELO: "warning",
    VERMELHO: "serious",
    CINZA: "neutral",
  };
  return map[status] ?? "neutral";
}
