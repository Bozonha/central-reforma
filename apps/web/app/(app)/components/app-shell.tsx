"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActionSearchBar } from "./action-search-bar";
import { ThemeToggle } from "./theme-toggle";
import { Icon } from "../../components/icons";
import { NAV_ITEMS } from "./nav-config";
import { sairDaConta } from "../../../lib/auth/actions";

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)]">
        CR
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--color-text)]">Central de Reforma</p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">Sistema Operacional da Reforma</p>
      </div>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            }`}
          >
            <Icon
              name={item.icon}
              className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[var(--color-primary)]" : "text-[var(--color-text-faint)] group-hover:text-[var(--color-text)]"}`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface Sessao {
  usuarioId: string;
  nome: string;
  email: string;
}

export function AppShell({ children, sessao }: { children: ReactNode; sessao: Sessao }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const iniciais = sessao.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
        <BrandMark />
        <NavLinks />
        <div className="border-t border-[var(--color-border)] px-5 py-4 text-xs text-[var(--color-text-faint)]">
          Dados reais · SQLite local
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-[var(--color-surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pr-3">
              <BrandMark />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] md:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <ActionSearchBar />
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--color-text)]">{sessao.nome}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{sessao.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
              {iniciais || "?"}
            </div>
            <form action={sairDaConta}>
              <button
                type="submit"
                title="Sair"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-serious)]"
              >
                <Icon name="logout" className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
