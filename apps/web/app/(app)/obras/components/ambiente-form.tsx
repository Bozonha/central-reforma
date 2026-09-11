"use client";

import { useActionState, useRef } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";
import { useFormLifecycle } from "../../../../lib/forms/use-form-lifecycle";

const INITIAL_STATE: FormState = {};

export function AmbienteForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  useFormLifecycle(formRef, state, pending);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Field label="Nome" htmlFor="nome" error={state.fieldErrors?.nome} className="col-span-2 sm:col-span-2">
        <Input id="nome" name="nome" required placeholder="Cozinha" />
      </Field>
      <Field label="Largura (m)" htmlFor="largura" error={state.fieldErrors?.largura}>
        <Input id="largura" name="largura" inputMode="decimal" placeholder="3,20" />
      </Field>
      <Field label="Comprimento (m)" htmlFor="comprimento" error={state.fieldErrors?.comprimento}>
        <Input id="comprimento" name="comprimento" inputMode="decimal" placeholder="4,00" />
      </Field>
      <div className="flex items-end">
        <Button type="submit" size="md" fullWidth icon="plus" loading={pending}>
          Adicionar
        </Button>
      </div>
      {state.error ? (
        <p className="col-span-full text-xs text-[var(--color-serious)]">{state.error}</p>
      ) : null}
    </form>
  );
}
