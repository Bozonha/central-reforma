import { RedefinirSenhaForm } from "./components/redefinir-senha-form";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)]">
            CR
          </div>
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Escolha uma nova senha</h1>
          <p className="text-sm text-[var(--color-text-muted)]">O link de redefinição vale por 1 hora e só pode ser usado uma vez.</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          {token ? (
            <RedefinirSenhaForm token={token} />
          ) : (
            <p className="rounded-lg bg-[var(--color-serious-soft)] px-3 py-2.5 text-sm text-[var(--color-serious)]">
              Link inválido ou incompleto. Solicite uma nova redefinição de senha.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
