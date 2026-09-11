"use client";

import { useActionState, useRef, useEffect } from "react";
import { TIPOS_DOCUMENTO } from "@central-reforma/domain";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";

const INITIAL_STATE: FormState = {};

export function DocumentoForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
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
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Tipo" htmlFor="tipo" error={state.fieldErrors?.tipo}>
        <Select id="tipo" name="tipo" defaultValue="OUTRO">
          {TIPOS_DOCUMENTO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Arquivo" htmlFor="arquivo" error={state.fieldErrors?.arquivo} className="col-span-2 sm:col-span-2">
        <Input id="arquivo" name="arquivo" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" />
      </Field>
      <div className="flex items-end">
        <Button type="submit" fullWidth icon="upload" loading={pending}>
          Enviar
        </Button>
      </div>
      {state.error ? <p className="col-span-full text-xs text-[var(--color-serious)]">{state.error}</p> : null}
    </form>
  );
}
