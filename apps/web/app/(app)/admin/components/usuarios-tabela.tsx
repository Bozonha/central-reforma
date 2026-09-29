"use client";

import { labelPapelConta, PAPEIS_CONTA, type PapelConta } from "@central-reforma/domain";
import { Badge, type BadgeTone } from "../../../components/ui/badge";
import { Select } from "../../../components/ui/form";
import { alterarPapelAction } from "../../../../lib/admin/actions";

interface UsuarioLinha {
  id: string;
  nome: string;
  email: string;
  papel: PapelConta;
  criadoEm: Date;
}

const TONE_POR_PAPEL: Record<PapelConta, BadgeTone> = {
  SUPERADMIN: "primary",
  ADMIN: "good",
  USUARIO: "neutral",
};

export function UsuariosTabela({
  usuarios,
  meuId,
  souSuperAdmin,
}: {
  usuarios: UsuarioLinha[];
  meuId: string;
  souSuperAdmin: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
            <th className="py-2 font-medium">Nome</th>
            <th className="py-2 font-medium">E-mail</th>
            <th className="py-2 font-medium">Papel</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
              <td className="py-2.5 font-medium text-[var(--color-text)]">
                {u.nome}
                {u.id === meuId ? <span className="ml-1.5 text-xs text-[var(--color-text-faint)]">(você)</span> : null}
              </td>
              <td className="py-2.5 text-[var(--color-text-muted)]">{u.email}</td>
              <td className="py-2.5">
                {souSuperAdmin && u.id !== meuId ? (
                  <form action={alterarPapelAction.bind(null, u.id)}>
                    <Select
                      name="papel"
                      defaultValue={u.papel}
                      className="w-auto py-1 text-xs"
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    >
                      {PAPEIS_CONTA.map((p) => (
                        <option key={p} value={p}>
                          {labelPapelConta(p)}
                        </option>
                      ))}
                    </Select>
                  </form>
                ) : (
                  <Badge tone={TONE_POR_PAPEL[u.papel]}>{labelPapelConta(u.papel)}</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
