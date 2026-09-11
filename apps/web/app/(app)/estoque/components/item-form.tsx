"use client";

import { useActionState, useRef } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";
import { useFormLifecycle } from "../../../../lib/forms/use-form-lifecycle";

const INITIAL_STATE: FormState = {};

export function ItemEstoqueForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  useFormLifecycle(formRef, state, pending);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Field label="Item" htmlFor="nomeLivre" error={state.fieldErrors?.nomeLivre} className="col-span-2">
        <Input id="nomeLivre" name="nomeLivre" required placeholder="Cimento CP-II 50kg" />
      </Field>
      <Field label="Quantidade" htmlFor="quantidade" error={state.fieldErrors?.quantidade}>
        <Input id="quantidade" name="quantidade" inputMode="decimal" required placeholder="10" />
      </Field>
      <Field label="Unidade" htmlFor="unidade" error={state.fieldErrors?.unidade}>
        <Input id="unidade" name="unidade" required placeholder="saco, un, m²..." />
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
