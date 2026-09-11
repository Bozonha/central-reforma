"use client";

import { useActionState } from "react";
import { Button } from "../../../components/ui/button";
import type { FormState } from "../../../../lib/obras/actions";

const INITIAL_STATE: FormState = {};

export function GeocodificarButton({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <Button type="submit" icon="map-pin" loading={pending} variant="secondary">
        Localizar endereço da obra
      </Button>
      {state.error ? <p className="text-xs text-[var(--color-serious)]">{state.error}</p> : null}
    </form>
  );
}
