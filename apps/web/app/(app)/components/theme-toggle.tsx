"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Icon } from "../../components/icons";

const OPTIONS = [
  { value: "light", label: "Claro", icon: "sun" as const },
  { value: "dark", label: "Escuro", icon: "moon" as const },
  { value: "system", label: "Sistema", icon: "monitor" as const },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[102px] rounded-lg border border-[var(--color-border)]" aria-hidden />;
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.label}
            onClick={() => setTheme(opt.value)}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              active
                ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
            }`}
          >
            <Icon name={opt.icon} className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
