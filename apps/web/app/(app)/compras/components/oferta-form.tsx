"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";
import type { OpcaoSelect } from "./compra-form";

const INITIAL_STATE: FormState = {};

export function OfertaForm({
  action,
  produtos,
  lojas,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  produtos: OpcaoSelect[];
  lojas: OpcaoSelect[];
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error && !state.fieldErrors) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  if (produtos.length === 0 || lojas.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-faint)]">
        Cadastre pelo menos um produto e uma loja acima para poder registrar um preço observado.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
      <Field label="Produto" htmlFor="produtoId" error={state.fieldErrors?.produtoId} className="col-span-2">
        <Select id="produtoId" name="produtoId" required defaultValue="">
          <option value="" disabled>
            Selecione
          </option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Loja" htmlFor="lojaId" error={state.fieldErrors?.lojaId} className="col-span-2">
        <Select id="lojaId" name="lojaId" required defaultValue="">
          <option value="" disabled>
            Selecione
          </option>
          {lojas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Preço (R$)" htmlFor="preco" error={state.fieldErrors?.preco}>
        <Input id="preco" name="preco" inputMode="decimal" required placeholder="89,90" />
      </Field>
      <Field label="Unidade" htmlFor="unidade" error={state.fieldErrors?.unidade}>
        <Input id="unidade" name="unidade" required placeholder="m², un..." />
      </Field>
      <div className="col-span-2 flex items-end sm:col-span-6">
        <Button type="submit" icon="plus" loading={pending}>
          Registrar preço observado
        </Button>
      </div>
      {state.error ? <p className="col-span-full text-xs text-[var(--color-serious)]">{state.error}</p> : null}
    </form>
  );
}
