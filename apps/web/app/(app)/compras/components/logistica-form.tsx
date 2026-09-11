"use client";

import { useActionState, useRef } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";
import { useFormLifecycle } from "../../../../lib/forms/use-form-lifecycle";

const INITIAL_STATE: FormState = {};

export interface LogisticaDefaults {
  combustivelPrecoLitro: string;
  veiculoKmPorLitro: string;
  pedagio: string;
  estacionamento: string;
}

export function LogisticaForm({
  action,
  defaults,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: LogisticaDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  useFormLifecycle(formRef, state, pending);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Field
        label="Combustível (R$/L)"
        htmlFor="combustivelPrecoLitro"
        error={state.fieldErrors?.combustivelPrecoLitro}
      >
        <Input
          id="combustivelPrecoLitro"
          name="combustivelPrecoLitro"
          inputMode="decimal"
          placeholder="6,10"
          defaultValue={defaults.combustivelPrecoLitro}
        />
      </Field>
      <Field label="Consumo do veículo (km/L)" htmlFor="veiculoKmPorLitro" error={state.fieldErrors?.veiculoKmPorLitro}>
        <Input
          id="veiculoKmPorLitro"
          name="veiculoKmPorLitro"
          inputMode="decimal"
          placeholder="12"
          defaultValue={defaults.veiculoKmPorLitro}
        />
      </Field>
      <Field label="Pedágio (R$, ida e volta)" htmlFor="pedagio" error={state.fieldErrors?.pedagio}>
        <Input id="pedagio" name="pedagio" inputMode="decimal" placeholder="0,00" defaultValue={defaults.pedagio} />
      </Field>
      <Field label="Estacionamento (R$)" htmlFor="estacionamento" error={state.fieldErrors?.estacionamento}>
        <Input
          id="estacionamento"
          name="estacionamento"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={defaults.estacionamento}
        />
      </Field>
      <div className="flex items-end">
        <Button type="submit" fullWidth variant="secondary" icon="check" loading={pending}>
          Salvar
        </Button>
      </div>
      {state.error ? <p className="col-span-full text-xs text-[var(--color-serious)]">{state.error}</p> : null}
    </form>
  );
}
