"use client";

import { useActionState } from "react";
import { OBRA_TIPOS } from "@central-reforma/domain";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select, Textarea } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";

const INITIAL_STATE: FormState = {};

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export interface ObraFormDefaults {
  nome: string;
  tipo: string;
  orcamentoTotalCent: number | null;
  dataInicio: Date | string | null;
  dataFimPrevista: Date | string | null;
  observacoes: string | null;
  logradouro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}

export function ObraForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: ObraFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome da obra" htmlFor="nome" error={state.fieldErrors?.nome} className="sm:col-span-2">
          <Input id="nome" name="nome" required defaultValue={defaults?.nome} placeholder="Reforma do apartamento" />
        </Field>

        <Field label="Tipo" htmlFor="tipo" error={state.fieldErrors?.tipo}>
          <Select id="tipo" name="tipo" defaultValue={defaults?.tipo ?? "CASA"}>
            {OBRA_TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Orçamento total (R$)" htmlFor="orcamentoTotal" error={state.fieldErrors?.orcamentoTotal} hint="Opcional — pode definir por categoria depois.">
          <Input
            id="orcamentoTotal"
            name="orcamentoTotal"
            inputMode="decimal"
            placeholder="50000,00"
            defaultValue={defaults?.orcamentoTotalCent != null ? (defaults.orcamentoTotalCent / 100).toFixed(2) : ""}
          />
        </Field>

        <Field label="Início previsto" htmlFor="dataInicio" error={state.fieldErrors?.dataInicio}>
          <Input id="dataInicio" name="dataInicio" type="date" defaultValue={toDateInputValue(defaults?.dataInicio)} />
        </Field>

        <Field label="Fim previsto" htmlFor="dataFimPrevista" error={state.fieldErrors?.dataFimPrevista}>
          <Input id="dataFimPrevista" name="dataFimPrevista" type="date" defaultValue={toDateInputValue(defaults?.dataFimPrevista)} />
        </Field>
      </div>

      <div className="border-t border-[var(--color-border)] pt-4">
        <p className="mb-3 text-xs font-medium text-[var(--color-text-muted)]">
          Endereço (usado para achar lojas de material próximas no mapa)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Logradouro" htmlFor="logradouro" error={state.fieldErrors?.logradouro} className="sm:col-span-2">
            <Input id="logradouro" name="logradouro" defaultValue={defaults?.logradouro ?? ""} placeholder="Rua, número, bairro" />
          </Field>
          <Field label="Cidade" htmlFor="cidade" error={state.fieldErrors?.cidade}>
            <Input id="cidade" name="cidade" defaultValue={defaults?.cidade ?? ""} />
          </Field>
          <Field label="Estado (UF)" htmlFor="estado" error={state.fieldErrors?.estado}>
            <Input id="estado" name="estado" maxLength={2} defaultValue={defaults?.estado ?? ""} placeholder="SP" />
          </Field>
          <Field label="CEP" htmlFor="cep" error={state.fieldErrors?.cep}>
            <Input id="cep" name="cep" defaultValue={defaults?.cep ?? ""} placeholder="00000-000" />
          </Field>
        </div>
      </div>

      <Field label="Observações" htmlFor="observacoes" error={state.fieldErrors?.observacoes}>
        <Textarea id="observacoes" name="observacoes" defaultValue={defaults?.observacoes ?? ""} placeholder="Notas gerais sobre a obra" />
      </Field>

      {state.error ? (
        <p className="rounded-lg bg-[var(--color-serious-soft)] px-3 py-2 text-xs text-[var(--color-serious)]">{state.error}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={pending} icon="check">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
