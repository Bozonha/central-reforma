"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (public/sw.js) uma vez no cliente. Falha em
 * silêncio se o navegador não suportar (Safari antigo, contexto não-HTTPS
 * em dev) — a instalabilidade do PWA é um extra, nunca uma dependência
 * para o app funcionar.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
