"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input, Textarea } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";

const INITIAL_STATE: FormState = {};

export function EntradaDiarioForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
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
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Data" htmlFor="data" error={state.fieldErrors?.data}>
          <Input id="data" name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
      </div>
      <Field label="O que aconteceu hoje?" htmlFor="texto" error={state.fieldErrors?.texto}>
        <Textarea id="texto" name="texto" required placeholder="Registre o progresso, decisões ou problemas do dia..." />
      </Field>
      <div>
        <Button type="submit" icon="plus" loading={pending}>
          Adicionar entrada
        </Button>
      </div>
      {state.error ? <p className="text-xs text-[var(--color-serious)]">{state.error}</p> : null}
    </form>
  );
}
