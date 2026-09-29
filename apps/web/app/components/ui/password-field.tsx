"use client";

import { useId, useState } from "react";
import { Field, Input } from "./form";
import { Icon } from "../icons";

/**
 * Campo de senha com botão de mostrar/ocultar. Usado em login e cadastro —
 * mantido como componente à parte porque o botão precisa de estado local
 * (aberto/fechado) e o `Input` puro não tem espaço reservado para ele.
 */
export function PasswordField({
  name,
  label,
  autoComplete,
  error,
  hint,
  placeholder = "••••••••",
  required = true,
}: {
  name: string;
  label: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [mostrar, setMostrar] = useState(false);
  const id = useId();

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={mostrar ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setMostrar((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]"
          aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
          tabIndex={-1}
        >
          <Icon name={mostrar ? "eye-off" : "eye"} className="h-4 w-4" />
        </button>
      </div>
    </Field>
  );
}
