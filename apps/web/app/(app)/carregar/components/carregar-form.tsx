"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Select, Textarea } from "../../../components/ui/form";
import { Icon } from "../../../components/icons";
import { prepararCarregamento } from "../../../../lib/ia/analisar-carregamento";
import { CATEGORIAS_CARREGAMENTO, ESTADO_INICIAL_CARREGAMENTO } from "../../../../lib/ia/carregamento-tipos";
import { RascunhoRecibo } from "./rascunho-recibo";

const CONFIANCA_CLASSE: Record<string, string> = {
  ALTA: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
  MEDIA: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  BAIXA: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
};

export function CarregarForm({ obraId }: { obraId: string }) {
  const [state, formAction, pending] = useActionState(prepararCarregamento, ESTADO_INICIAL_CARREGAMENTO);
  const formRef = useRef<HTMLFormElement>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  const fieldErrors = "fieldErrors" in state ? state.fieldErrors : undefined;
  const erro = "error" in state ? state.error : undefined;
  const concluido = state.status === "RASCUNHO_RECIBO" || state.status === "RESUMO_GENERICO";

  return (
    <div className="flex flex-col gap-4">
      {!concluido ? (
        <form
          ref={formRef}
          action={formAction}
          className="flex flex-col gap-3"
          onSubmit={() => {
            /* mantém o nome do arquivo visível enquanto a análise roda */
          }}
        >
          <input type="hidden" name="obraId" value={obraId} />

          <Field label="Categoria" htmlFor="categoria" error={fieldErrors?.categoria}>
            <Select id="categoria" name="categoria" defaultValue="RECIBO" required>
              {CATEGORIAS_CARREGAMENTO.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Descrição breve" htmlFor="descricao" error={fieldErrors?.descricao} hint="Opcional — ajuda a IA a entender o contexto, mas nunca substitui o que está na foto.">
            <Textarea id="descricao" name="descricao" placeholder="Ex.: cimento e argamassa comprados na loja X para o banheiro" rows={2} />
          </Field>

          <Field label="Foto ou arquivo" htmlFor="arquivo" error={fieldErrors?.arquivo}>
            <label
              htmlFor="arquivo"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-8 text-center hover:border-[var(--color-primary)]"
            >
              <Icon name="upload" className="h-6 w-6 text-[var(--color-text-faint)]" />
              <span className="text-sm font-medium text-[var(--color-text)]">{nomeArquivo ?? "Toque para tirar uma foto ou escolher da galeria"}</span>
              <span className="text-xs text-[var(--color-text-faint)]">JPG, PNG, WEBP ou PDF — até 15MB</span>
              <input
                id="arquivo"
                name="arquivo"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                className="sr-only"
                onChange={(e) => setNomeArquivo(e.currentTarget.files?.[0]?.name ?? null)}
              />
            </label>
          </Field>

          <Button type="submit" icon="sparkles" loading={pending} fullWidth>
            Analisar com IA
          </Button>

          {erro ? <p className="text-xs text-[var(--color-serious)]">{erro}</p> : null}
        </form>
      ) : null}

      {state.status === "RASCUNHO_RECIBO" ? (
        <RascunhoRecibo
          obraId={obraId}
          documentoId={state.documentoId}
          loja={state.loja}
          data={state.data}
          observacoes={state.observacoes}
          itensIniciais={state.itens}
          onNovoEnvio={() => {
            setNomeArquivo(null);
            formRef.current?.reset();
          }}
        />
      ) : null}

      {state.status === "RESUMO_GENERICO" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
            <p className="mb-2 flex items-center gap-1.5 font-medium text-[var(--color-text)]">
              <Icon name="sparkles" className="h-4 w-4 text-[var(--color-primary)]" />
              {state.tipoIdentificado ?? "Documento analisado"}
            </p>
            <p className="mb-2 text-[var(--color-text)]">{state.resumo}</p>
            {state.pontosChave.length > 0 ? (
              <ul className="mb-2 flex flex-col gap-1">
                {state.pontosChave.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--color-text-faint)]" />
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}
            {state.valores.length > 0 ? (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {state.valores.map((v, i) => (
                  <li key={i} className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text)]">
                    {v}
                  </li>
                ))}
              </ul>
            ) : null}
            {state.alertas.length > 0 ? (
              <ul className="mb-2 flex flex-col gap-1">
                {state.alertas.map((a, i) => (
                  <li key={i} className="rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-2 py-1 text-xs text-[var(--color-warning)]">
                    {a}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-xs text-[var(--color-text-faint)]">
              Isso não foi gravado em Compras, Estoque ou Orçamento — é só um resumo. O documento ficou salvo em Documentos.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            icon="upload"
            onClick={() => {
              setNomeArquivo(null);
              window.location.reload();
            }}
          >
            Enviar outra foto
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { CONFIANCA_CLASSE };
