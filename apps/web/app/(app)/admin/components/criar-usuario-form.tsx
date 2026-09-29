"use client";

import { useActionState, useRef } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select } from "../../../components/ui/form";
import { useFormLifecycle } from "../../../../lib/forms/use-form-lifecycle";
import type { FormState } from "../../../../lib/forms/state";
import { criarUsuarioAdmin } from "../../../../lib/admin/actions";

const INITIAL_STATE: FormState = {};

export function CriarUsuarioForm({ podeEscolherAdmin }: { podeEscolherAdmin: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(criarUsuarioAdmin, INITIAL_STATE);
  useFormLifecycle(formRef, state, pending);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Nome" htmlFor="nome" error={state.fieldErrors?.nome}>
        <Input id="nome" name="nome" required defaultValue={state.values?.nome} />
      </Field>
      <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" required defaultValue={state.values?.email} />
      </Field>
      <Field label="Senha" htmlFor="senha" error={state.fieldErrors?.senha}>
        <Input id="senha" name="senha" type="password" required />
      </Field>
      <Field label="Confirmar senha" htmlFor="confirmaSenha" error={state.fieldErrors?.confirmaSenha}>
        <Input id="confirmaSenha" name="confirmaSenha" type="password" required />
      </Field>
      {podeEscolherAdmin ? (
        <Field label="Papel" htmlFor="papel">
          <Select id="papel" name="papel" defaultValue="USUARIO">
            <option value="USUARIO">Usuário</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
      ) : (
        <input type="hidden" name="papel" value="USUARIO" />
      )}
      <div className="flex items-end sm:col-span-2">
        <Button type="submit" icon="plus" loading={pending}>
          Criar conta
        </Button>
      </div>
      {state.error ? <p className="text-xs text-[var(--color-serious)] sm:col-span-2">{state.error}</p> : null}
    </form>
  );
}
