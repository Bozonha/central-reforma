"use client";

import { useActionState } from "react";
import Link from "next/link";
import { entrarComCredenciais, type AuthFormState } from "../../lib/auth/actions";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/form";

const INITIAL_STATE: AuthFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(entrarComCredenciais, INITIAL_STATE);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)]">
            CR
          </div>
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Central de Reforma</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Entre para continuar sua obra.</p>
        </div>

        <form
          action={formAction}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
        >
          <div className="flex flex-col gap-4">
            <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email}>
              <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" />
            </Field>
            <Field label="Senha" htmlFor="senha" error={state.fieldErrors?.senha}>
              <Input id="senha" name="senha" type="password" autoComplete="current-password" required placeholder="••••••••" />
            </Field>

            {state.error ? (
              <p className="rounded-lg bg-[var(--color-serious-soft)] px-3 py-2 text-xs text-[var(--color-serious)]">
                {state.error}
              </p>
            ) : null}

            <Button type="submit" size="lg" fullWidth loading={pending}>
              Entrar
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Ainda não tem conta?{" "}
          <Link href="/registro" className="font-medium text-[var(--color-primary)] hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
