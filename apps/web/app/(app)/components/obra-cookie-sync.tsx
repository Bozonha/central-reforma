"use client";

import { useEffect } from "react";
import { setObraAtivaCookie } from "../../../lib/obras/obra-cookie-client";

/**
 * Componente invisível: grava `obraId` como a "obra ativa" (cookie
 * `cr_obra_ativa`) sempre que uma página que não usa `ObraSelector` — como
 * a página de detalhe de uma obra — é aberta. Mantém a barra lateral
 * (app-shell.tsx) levando o usuário para a obra certa ao trocar de módulo.
 */
export function ObraCookieSync({ obraId }: { obraId: string }) {
  useEffect(() => {
    setObraAtivaCookie(obraId);
  }, [obraId]);

  return null;
}
