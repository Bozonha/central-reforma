import type { ReactNode } from "react";
import { requireSession } from "../../lib/auth/actions";
import { AppShell } from "./components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sessao = await requireSession();
  return <AppShell sessao={sessao}>{children}</AppShell>;
}
