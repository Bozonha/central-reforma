"use client";

import { useActionState, useRef } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";
import { useFormLifecycle } from "../../../../lib/forms/use-form-lifecycle";

const INITIAL_STATE: FormState = {};

export interface OpcaoSelect {
  id: string;
  nome: string;
}

export function CompraForm({
  action,
  produtos,
  lojas,
  itemListaComprasId,
  nomeInicial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  produtos: OpcaoSelect[];
  lojas: OpcaoSelect[];
  itemListaComprasId?: string;
  nomeInicial?: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  useFormLifecycle(formRef, state, pending);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
      {itemListaComprasId ? <input type="hidden" name="itemListaComprasId" value={itemListaComprasId} /> : null}
      <Field label="O que comprou" htmlFor="nomeLivre" error={state.fieldErrors?.nomeLivre} className="col-span-2">
        <Input id="nomeLivre" name="nomeLivre" required defaultValue={nomeInicial} placeholder="Cimento CP-II 50kg" />
      </Field>
      <Field label="Produto do catálogo" htmlFor="produtoId" error={state.fieldErrors?.produtoId}>
        <Select id="produtoId" name="produtoId" defaultValue="">
          <option value="">— opcional —</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Loja" htmlFor="lojaId" error={state.fieldErrors?.lojaId}>
        <Select id="lojaId" name="lojaId" defaultValue="">
          <option value="">— opcional —</option>
          {lojas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Quantidade" htmlFor="quantidade" error={state.fieldErrors?.quantidade}>
        <Input id="quantidade" name="quantidade" inputMode="decimal" required placeholder="10" />
      </Field>
      <Field label="Preço unitário (R$)" htmlFor="precoUnitario" error={state.fieldErrors?.precoUnitario}>
        <Input id="precoUnitario" name="precoUnitario" inputMode="decimal" required placeholder="35,90" />
      </Field>
      <Field label="Forma de pagamento" htmlFor="formaPagamento" error={state.fieldErrors?.formaPagamento}>
        <Input id="formaPagamento" name="formaPagamento" placeholder="Pix, cartão..." />
      </Field>
      <Field label="Data" htmlFor="data" error={state.fieldErrors?.data}>
        <Input id="data" name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </Field>
      <div className="col-span-2 flex items-end sm:col-span-6">
        <Button type="submit" icon="plus" loading={pending}>
          Registrar compra
        </Button>
      </div>
      {state.error ? <p className="col-span-full text-xs text-[var(--color-serious)]">{state.error}</p> : null}
    </form>
  );
}
