import type { ReactNode } from "react";
import { podeAcessarPainelAdmin } from "@central-reforma/domain";
import { requireSession } from "../../lib/auth/actions";
import { papelContaAtual } from "../../lib/auth/rbac";
import { AppShell } from "./components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sessao = await requireSession();
  const meuPapel = await papelContaAtual(sessao.usuarioId);
  return (
    <AppShell sessao={sessao} podeAcessarAdmin={podeAcessarPainelAdmin(meuPapel)}>
      {children}
    </AppShell>
  );
}
