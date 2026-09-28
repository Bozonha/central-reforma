"use client";

import { useState, useTransition } from "react";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/icons";
import { analisarPlanta, type ResultadoAnalisePlanta } from "../../../../lib/ia/analisar-planta";

const CONFIANCA_LABEL: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
  NAO_LEGIVEL: "Não deu pra ler",
};

const CONFIANCA_CLASSE: Record<string, string> = {
  ALTA: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
  MEDIA: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  BAIXA: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  NAO_LEGIVEL: "bg-[var(--color-serious-soft)] text-[var(--color-serious)]",
};

function formatMetros(v: number | null) {
  return v === null ? "—" : `${v.toFixed(2)} m`;
}

export function AnalisarPlantaButton({ obraId, documentoId }: { obraId: string; documentoId: string }) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ResultadoAnalisePlanta | null>(null);

  function rodar() {
    setResultado(null);
    startTransition(async () => {
      const r = await analisarPlanta(obraId, documentoId);
      setResultado(r);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary" size="sm" icon="sparkles" loading={pending} onClick={rodar}>
        Analisar com IA
      </Button>

      {resultado ? (
        resultado.ok ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
            <p className="mb-2 flex items-center gap-1.5 font-medium text-[var(--color-text)]">
              <Icon name="sparkles" className="h-4 w-4 text-[var(--color-primary)]" />
              {resultado.ambientes.length === 0
                ? "Não encontrei ambientes com medidas legíveis nesta planta."
                : `${resultado.ambientes.length} ambiente(s) atualizado(s) em Ambientes — confira as medidas.`}
            </p>
            {resultado.observacoesGerais ? (
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">{resultado.observacoesGerais}</p>
            ) : null}
            {resultado.ambientes.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {resultado.ambientes.map((a, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 rounded-md bg-[var(--color-surface)] px-2 py-1.5">
                    <span className="font-medium text-[var(--color-text)]">{a.nome}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formatMetros(a.larguraM)} × {formatMetros(a.comprimentoM)}
                      {a.alturaM !== null ? ` · pé-direito ${formatMetros(a.alturaM)}` : ""}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CONFIANCA_CLASSE[a.confianca]}`}>
                      {CONFIANCA_LABEL[a.confianca]}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-faint)]">{a.acao === "CRIADO" ? "novo" : "atualizado"}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-xs text-[var(--color-text-faint)]">
              São estimativas da IA a partir da imagem — confira presencialmente antes de usar em compras ou orçamento.
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-[var(--color-serious)]/30 bg-[var(--color-serious-soft)] p-3 text-sm text-[var(--color-serious)]">
            {resultado.erro}
          </p>
        )
      ) : null}
    </div>
  );
}
