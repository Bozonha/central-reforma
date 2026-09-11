import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-text-faint)]">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
        {description ? <p className="mt-1 max-w-sm text-xs text-[var(--color-text-muted)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
