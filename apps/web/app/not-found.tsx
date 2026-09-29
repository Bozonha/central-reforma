import Link from "next/link";
import { LinkButton } from "./components/ui/button";
import { Icon } from "./components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)]">
          CR
        </div>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-neutral-status-soft)] text-[var(--color-neutral-status)]">
          <Icon name="search" className="h-5 w-5" />
        </div>

        <h1 className="text-lg font-semibold text-[var(--color-text)]">Página não encontrada</h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          O endereço não existe ou foi movido. Confira o link ou volte para o painel da sua obra.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <LinkButton href="/" icon="dashboard">
            Voltar para o Dashboard
          </LinkButton>
          <Link href="/obras" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
            Ver minhas obras
          </Link>
        </div>
      </div>
    </div>
  );
}
