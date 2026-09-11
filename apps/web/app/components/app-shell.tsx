"use client";

import { useState, type ReactNode } from "react";
import { ActionSearchBar } from "./action-search-bar";
import { Icon } from "./icons";
import { NAV_ITEMS } from "./nav-config";

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
        CR
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          Central de Reforma
        </p>
        <p className="truncate text-xs text-slate-500">
          Sistema Operacional da Reforma
        </p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.label}
          href={item.href}
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Icon
            name={item.icon}
            className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-slate-700"
          />
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar fixa — desktop apenas */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <BrandMark />
        <NavLinks />
        <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-400">
          MVP 0 · dados de exemplo
        </div>
      </aside>

      {/* Menu mobile: overlay + drawer, acionado pelo hambúrguer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pr-3">
              <BrandMark />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Área principal */}
      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <ActionSearchBar />
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">Maria Souza</p>
              <p className="text-xs text-slate-500">Proprietária</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              MS
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
