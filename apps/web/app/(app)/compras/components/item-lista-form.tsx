"use client";

import { useActionState, useRef, useEffect } from "react";
import { PRIORIDADES } from "@central-reforma/domain";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";

const INITIAL_STATE: FormState = {};

export function ItemListaForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error && !state.fieldErrors) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
      <Field label="Item" htmlFor="nomeLivre" error={state.fieldErrors?.nomeLivre} className="col-span-2 sm:col-span-2">
        <Input id="nomeLivre" name="nomeLivre" required placeholder="Porcelanato sala (32m²)" />
      </Field>
      <Field label="Quantidade" htmlFor="quantidadeNecessaria" error={state.fieldErrors?.quantidadeNecessaria}>
        <Input id="quantidadeNecessaria" name="quantidadeNecessaria" inputMode="decimal" required placeholder="32" />
      </Field>
      <Field label="Prioridade" htmlFor="prioridade" error={state.fieldErrors?.prioridade}>
        <Select id="prioridade" name="prioridade" defaultValue="MEDIA">
          {PRIORIDADES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Etapa" htmlFor="etapa" error={state.fieldErrors?.etapa}>
        <Input id="etapa" name="etapa" placeholder="Acabamento" />
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
