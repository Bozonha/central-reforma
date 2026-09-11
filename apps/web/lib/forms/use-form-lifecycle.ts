"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { FormState } from "./state";

/**
 * React reseta os campos não controlados de um <form action={...}> sempre
 * que a Server Action termina — mesmo quando ela só devolveu um erro de
 * validação em vez de lançar exceção (do ponto de vista do React, a função
 * "completou com sucesso"). Sem tratar isso, o usuário perde tudo que já
 * tinha digitado toda vez que erra o preenchimento de um campo.
 *
 * Este hook substitui o antigo padrão "só chama form.reset() quando não há
 * erro" (que não impedia o reset automático do React) por um comportamento
 * correto: em erro, repõe os valores enviados (`state.values`, ver
 * `valoresDoFormulario`); em sucesso, deixa o reset nativo limpar o
 * formulário para o próximo cadastro.
 */
export function useFormLifecycle(
  formRef: RefObject<HTMLFormElement | null>,
  state: FormState,
  pending: boolean,
) {
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      const form = formRef.current;
      const falhou = Boolean(state.error || state.fieldErrors);
      if (form && falhou && state.values) {
        for (const [nome, valor] of Object.entries(state.values)) {
          const campo = form.elements.namedItem(nome);
          if (campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement || campo instanceof HTMLTextAreaElement) {
            campo.value = valor;
          }
        }
      }
    }
    wasPending.current = pending;
  }, [pending, state, formRef]);
}
