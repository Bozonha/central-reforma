"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";

const INITIAL_STATE: FormState = {};

export function ProdutoForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
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
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Field label="Nome do produto" htmlFor="nome" error={state.fieldErrors?.nome} className="col-span-2">
        <Input id="nome" name="nome" required placeholder="Porcelanato acetinado 60x60" />
      </Field>
      <Field label="Categoria" htmlFor="categoria" error={state.fieldErrors?.categoria}>
        <Input id="categoria" name="categoria" placeholder="Pisos" />
      </Field>
      <Field label="Unidade" htmlFor="unidade" error={state.fieldErrors?.unidade}>
        <Input id="unidade" name="unidade" required placeholder="m², un, saco..." />
      </Field>
      <div className="flex items-end">
        <Button type="submit" fullWidth icon="plus" loading={pending}>
          Cadastrar
        </Button>
      </div>
      {state.error ? <p className="col-span-full text-xs text-[var(--color-serious)]">{state.error}</p> : null}
    </form>
  );
}
