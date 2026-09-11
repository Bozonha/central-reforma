"use client";

import { useActionState, useRef } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";
import { useFormLifecycle } from "../../../../lib/forms/use-form-lifecycle";

const INITIAL_STATE: FormState = {};

export function LinhaOrcamentoForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  useFormLifecycle(formRef, state, pending);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Field label="Categoria" htmlFor="categoria" error={state.fieldErrors?.categoria} className="col-span-2">
        <Input id="categoria" name="categoria" required placeholder="Pisos e revestimentos" />
      </Field>
      <Field label="Planejado (R$)" htmlFor="planejado" error={state.fieldErrors?.planejado}>
        <Input id="planejado" name="planejado" inputMode="decimal" required placeholder="10000,00" />
      </Field>
      <Field label="Comprado (R$)" htmlFor="comprado" error={state.fieldErrors?.comprado}>
        <Input id="comprado" name="comprado" inputMode="decimal" placeholder="0,00" />
      </Field>
      <div className="flex items-end">
        <Button type="submit" fullWidth icon="plus" loading={pending}>
          Adicionar
        </Button>
      </div>
      {state.error ? <p className="col-span-full text-xs text-[var(--color-serious)]">{state.error}</p> : null}
    </form>
  );
}
