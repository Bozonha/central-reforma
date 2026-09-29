"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRecuperacaoSenha, type RecuperarSenhaState } from "../../lib/auth/reset-senha";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/form";

const INITIAL_STATE: RecuperarSenhaState = {};

export default function RecuperarSenhaPage() {
  const [state, formAction, pending] = useActionState(solicitarRecuperacaoSenha, INITIAL_STATE);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)]">
            CR
          </div>
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Recuperar senha</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Informe seu e-mail para receber um link de redefinição.</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          {state.mensagem ? (
            <p className="rounded-lg bg-[var(--color-good-soft)] px-3 py-2.5 text-sm text-[var(--color-good)]">{state.mensagem}</p>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email}>
                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" />
              </Field>
              <Button type="submit" size="lg" fullWidth loading={pending}>
                Enviar link de redefinição
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
