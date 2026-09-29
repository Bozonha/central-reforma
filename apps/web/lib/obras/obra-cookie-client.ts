/**
 * Helpers client-side para o cookie `cr_obra_ativa` (ver obra-cookie.ts para
 * o porquê do arquivo separado). Só devem ser chamados a partir de
 * componentes "use client".
 */
import { OBRA_ATIVA_EVENT, OBRA_COOKIE_MAX_AGE_SECONDS, OBRA_COOKIE_NAME } from "./obra-cookie";

export function setObraAtivaCookie(obraId: string): void {
  document.cookie = `${OBRA_COOKIE_NAME}=${obraId}; path=/; max-age=${OBRA_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  window.dispatchEvent(new CustomEvent(OBRA_ATIVA_EVENT, { detail: obraId }));
}

export function lerObraAtivaCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${OBRA_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? "") || null : null;
}
