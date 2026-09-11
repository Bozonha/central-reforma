"use client";

import { useRouter, usePathname } from "next/navigation";
import { Select } from "../../components/ui/form";

export interface ObraOption {
  id: string;
  nome: string;
}

export function ObraSelector({ obras, obraId }: { obras: ObraOption[]; obraId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={obraId}
      onChange={(e) => router.push(`${pathname}?obraId=${e.target.value}`)}
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
