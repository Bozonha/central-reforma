"use client";

import { useActionState } from "react";
import { Button } from "../../../components/ui/button";
import { Input, Select } from "../../../components/ui/form";
import type { FormState } from "../../../../lib/obras/actions";

const INITIAL_STATE: FormState = {};

export function ColaboradorForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
      <div className="flex-1">
        <Input name="email" type="email" required placeholder="email@exemplo.com" />
      </div>
      <Select name="papel" defaultValue="COLABORADOR" className="sm:w-44">
        <option value="COLABORADOR">Colaborador</option>
        <option value="VISUALIZADOR">Visualizador</option>
      </Select>
      <Button type="submit" icon="plus" loading={pending}>
        Adicionar
      </Button>
      {state.error ? <p className="text-xs text-[var(--color-serious)] sm:basis-full">{state.error}</p> : null}
    </form>
  );
}
