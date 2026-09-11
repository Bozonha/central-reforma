"use client";

import dynamic from "next/dynamic";
import type { LojaDescobertaMapa, LojaMapa } from "./lojas-map";

const LojasMapInner = dynamic(() => import("./lojas-map").then((m) => m.LojasMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text-faint)]">
      Carregando mapa…
    </div>
  ),
});

export function LojasMapClient(props: {
  obra: { nome: string; latitude: number; longitude: number };
  lojasSalvas: LojaMapa[];
  lojasDescobertas: LojaDescobertaMapa[];
}) {
  return <LojasMapInner {...props} />;
}
