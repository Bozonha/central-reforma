"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Select } from "../../components/ui/form";
import { setObraAtivaCookie } from "../../../lib/obras/obra-cookie-client";

export interface ObraOption {
  id: string;
  nome: string;
}

export function ObraSelector({ obras, obraId }: { obras: ObraOption[]; obraId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  // Mantém o cookie em dia mesmo quando a obra foi resolvida por fallback
  // (nenhum ?obraId= na URL) — assim a barra lateral, que lê esse cookie
  // para montar os links dos outros módulos, sempre reflete a obra atual.
  useEffect(() => {
    setObraAtivaCookie(obraId);
  }, [obraId]);

  return (
    <Select
      value={obraId}
      onChange={(e) => {
        setObraAtivaCookie(e.target.value);
        router.push(`${pathname}?obraId=${e.target.value}`);
      }}
      className="w-auto min-w-[220px]"
      aria-label="Selecionar obra"
    >
      {obras.map((o) => (
        <option key={o.id} value={o.id}>
          {o.nome}
        </option>
      ))}
    </Select>
  );
}
