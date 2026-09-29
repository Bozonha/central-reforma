"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "../../components/icons";
import { NAV_ITEMS } from "./nav-config";
import { buscarComando, type ResultadoBusca } from "../../../lib/busca/actions";

interface ItemPaleta {
  key: string;
  titulo: string;
  subtitulo: string;
  href: string;
  icon: IconName;
}

function navParaItens(): ItemPaleta[] {
  return NAV_ITEMS.map((item) => ({
    key: `nav-${item.href}`,
    titulo: item.label,
    subtitulo: "Ir para módulo",
    href: item.href,
    icon: item.icon,
  }));
}

function iconeDoTipo(tipo: ResultadoBusca["tipo"]): IconName {
  if (tipo === "obra") return "obras";
  if (tipo === "ambiente") return "ambientes";
  return "documentos";
}

/**
 * Paleta de comandos (Cmd/Ctrl+K): substitui o antigo botão desabilitado
 * "De que você precisa?" por busca real, sempre escoparia pelas obras do
 * usuário (ver lib/busca/actions.ts). Sem query digitada mostra atalhos para
 * os módulos; com 2+ caracteres busca obras/ambientes/documentos no servidor.
 */
export function CommandPalette() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const itensNav = useMemo(() => navParaItens(), []);

  const itensVisiveis: ItemPaleta[] = useMemo(() => {
    if (query.trim().length < 2) return itensNav;
    return resultados.map((r) => ({
      key: `${r.tipo}-${r.id}`,
      titulo: r.titulo,
      subtitulo: r.subtitulo,
      href: r.href,
      icon: iconeDoTipo(r.tipo),
    }));
  }, [query, resultados, itensNav]);

  const fechar = useCallback(() => {
    setAberto(false);
    setQuery("");
    setResultados([]);
    setIndiceAtivo(0);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberto((prev) => !prev);
        return;
      }
      if (e.key === "Escape" && aberto) {
        fechar();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aberto, fechar]);

  useEffect(() => {
    if (aberto) inputRef.current?.focus();
  }, [aberto]);

  // Não zera estado diretamente no corpo do efeito (dispara o lint
  // react-hooks/set-state-in-effect) — a query digitada já muda via
  // onQueryChange abaixo; este efeito só agenda a busca assíncrona.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const timeoutId = setTimeout(() => {
      startTransition(async () => {
        const r = await buscarComando(query);
        setResultados(r);
      });
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  function onQueryChange(valor: string) {
    setQuery(valor);
    setIndiceAtivo(0);
    if (valor.trim().length < 2) setResultados([]);
  }

  function irPara(href: string) {
    router.push(href);
    fechar();
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceAtivo((i) => Math.min(i + 1, itensVisiveis.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = itensVisiveis[indiceAtivo];
      if (item) irPara(item.href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-left text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] sm:max-w-md"
      >
        <Icon name="search" className="h-4 w-4 shrink-0 text-[var(--color-text-faint)]" />
        <span className="truncate text-sm">Buscar obras, ambientes, documentos…</span>
        <span className="ml-auto hidden shrink-0 items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-faint)] sm:flex">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      {aberto ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Fechar busca"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={fechar}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-4 py-3">
              <Icon name="search" className="h-4 w-4 shrink-0 text-[var(--color-text-faint)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Buscar ou navegar para um módulo…"
                className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-faint)]"
              />
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="rounded-md p-1 text-[var(--color-text-faint)] hover:bg-[var(--color-bg)]"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5">
              {isPending && query.trim().length >= 2 ? (
                <p className="px-3 py-4 text-center text-xs text-[var(--color-text-faint)]">Buscando…</p>
              ) : itensVisiveis.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-[var(--color-text-faint)]">
                  {query.trim().length >= 2 ? "Nada encontrado." : "Digite para buscar."}
                </p>
              ) : (
                itensVisiveis.map((item, i) => (
                  <button
                    key={item.key}
                    type="button"
                    onMouseEnter={() => setIndiceAtivo(i)}
                    onClick={() => irPara(item.href)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      i === indiceAtivo
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      className={`h-4 w-4 shrink-0 ${i === indiceAtivo ? "text-[var(--color-primary)]" : "text-[var(--color-text-faint)]"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.titulo}</span>
                      <span className="block truncate text-xs text-[var(--color-text-muted)]">{item.subtitulo}</span>
                    </span>
                    <Icon name="chevron-right" className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-faint)]" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
