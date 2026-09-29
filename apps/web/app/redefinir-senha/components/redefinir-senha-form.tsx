"use client";

import { useActionState, useRef } from "react";
import { redefinirSenha, type RedefinirSenhaState } from "../../../lib/auth/reset-senha";
import { Button } from "../../components/ui/button";
import { PasswordField } from "../../components/ui/password-field";
import { useFormLifecycle } from "../../../lib/forms/use-form-lifecycle";

const INITIAL_STATE: RedefinirSenhaState = {};

export function RedefinirSenhaForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(redefinirSenha, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  useFormLifecycle(formRef, state, pending);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <PasswordField
        name="novaSenha"
        label="Nova senha"
        autoComplete="new-password"
        error={state.fieldErrors?.novaSenha}
        hint="Mínimo de 8 caracteres."
      />
      <PasswordField
        name="confirmaSenha"
        label="Confirme a nova senha"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmaSenha}
      />

      {state.error ? (
        <p className="rounded-lg bg-[var(--color-serious-soft)] px-3 py-2 text-xs text-[var(--color-serious)]">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" fullWidth loading={pending}>
        Redefinir senha
      </Button>
    </form>
  );
}
