"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";

const INITIAL_STATE: FormState = {};

export function LojaForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
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
      <Field label="Nome da loja" htmlFor="nome" error={state.fieldErrors?.nome} className="col-span-2">
        <Input id="nome" name="nome" required placeholder="Depósito São José" />
      </Field>
      <Field label="Tipo" htmlFor="tipo" error={state.fieldErrors?.tipo}>
        <Select id="tipo" name="tipo" defaultValue="FISICA">
          <option value="FISICA">Loja física</option>
          <option value="ONLINE">Loja online</option>
        </Select>
      </Field>
      <Field label="Endereço / cidade" htmlFor="logradouro" error={state.fieldErrors?.logradouro} className="col-span-2">
        <Input id="logradouro" name="logradouro" placeholder="Rua das Flores, 100" />
      </Field>
      <Field label="Cidade" htmlFor="cidade" error={state.fieldErrors?.cidade}>
        <Input id="cidade" name="cidade" placeholder="São Paulo" />
      </Field>
      <Field label="UF" htmlFor="estado" error={state.fieldErrors?.estado}>
        <Input id="estado" name="estado" maxLength={2} placeholder="SP" />
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
