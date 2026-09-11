"use client";

import { useActionState, useRef } from "react";
import { PRIORIDADES } from "@central-reforma/domain";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";
import { useFormLifecycle } from "../../../../lib/forms/use-form-lifecycle";

const INITIAL_STATE: FormState = {};

export function TarefaForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  useFormLifecycle(formRef, state, pending);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
      <Field label="Tarefa" htmlFor="titulo" error={state.fieldErrors?.titulo} className="col-span-2 sm:col-span-2">
        <Input id="titulo" name="titulo" required placeholder="Instalar piso do quarto" />
      </Field>
      <Field label="Responsável" htmlFor="responsavel" error={state.fieldErrors?.responsavel}>
        <Input id="responsavel" name="responsavel" placeholder="Pedreiro João" />
      </Field>
      <Field label="Início" htmlFor="inicio" error={state.fieldErrors?.inicio}>
        <Input id="inicio" name="inicio" type="date" />
      </Field>
      <Field label="Fim previsto" htmlFor="fim" error={state.fieldErrors?.fim}>
        <Input id="fim" name="fim" type="date" />
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
      <div className="col-span-2 flex items-end sm:col-span-6">
        <Button type="submit" icon="plus" loading={pending}>
          Adicionar tarefa
        </Button>
      </div>
      {state.error ? <p className="col-span-full text-xs text-[var(--color-serious)]">{state.error}</p> : null}
    </form>
  );
}
