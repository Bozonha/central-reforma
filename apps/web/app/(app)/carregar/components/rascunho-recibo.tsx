"use client";

import { useState, useTransition } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/form";
import { Icon } from "../../../components/icons";
import { confirmarCarregamentoRecibo } from "../../../../lib/ia/analisar-carregamento";
import type { ItemReciboRascunho } from "../../../../lib/ia/carregamento-tipos";

const CONFIANCA_CLASSE: Record<string, string> = {
  ALTA: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
  MEDIA: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  BAIXA: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
};

type LinhaEditavel = { nomeLivre: string; quantidade: string; precoUnitario: string; incluir: boolean; confianca: ItemReciboRascunho["confianca"] };

function paraNumero(texto: string | null): string {
  if (!texto) return "";
  const n = Number(texto.replace(/[^\d.,]/g, "").replace(".", "").replace(",", "."));
  return Number.isNaN(n) ? "" : String(n);
}

export function RascunhoRecibo({
  obraId,
  documentoId,
  loja,
  data,
  observacoes,
  itensIniciais,
  onNovoEnvio,
}: {
  obraId: string;
  documentoId: string;
  loja: string | null;
  data: string | null;
  observacoes: string | null;
  itensIniciais: ItemReciboRascunho[];
  onNovoEnvio: () => void;
}) {
  const [linhas, setLinhas] = useState<LinhaEditavel[]>(
    itensIniciais.map((i) => ({
      nomeLivre: i.nomeLivre,
      quantidade: i.quantidade !== null ? String(i.quantidade) : "1",
      precoUnitario: paraNumero(i.precoUnitarioTexto) || paraNumero(i.valorTotalTexto),
      incluir: true,
      confianca: i.confianca,
    })),
  );
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ error?: string; salvos?: number } | null>(null);

  function atualizarLinha(idx: number, campo: keyof LinhaEditavel, valor: string | boolean) {
    setLinhas((prev) => prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));
  }

  function confirmar() {
    const itens = linhas
      .filter((l) => l.incluir)
      .map((l) => ({
        nomeLivre: l.nomeLivre,
        quantidade: Number(l.quantidade.replace(",", ".")) || 0,
        precoUnitario: Number(l.precoUnitario.replace(",", ".")) || 0,
      }));
    startTransition(async () => {
      const r = await confirmarCarregamentoRecibo(obraId, documentoId, itens);
      setResultado(r);
    });
  }

  if (resultado?.salvos) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-good)]/30 bg-[var(--color-good-soft)] p-3 text-sm text-[var(--color-good)]">
        <p className="flex items-center gap-1.5 font-medium">
          <Icon name="check" className="h-4 w-4" />
          {resultado.salvos} item(ns) registrado(s) em Compras e sincronizado(s) com o Estoque.
        </p>
        <Button type="button" variant="secondary" size="sm" icon="upload" onClick={onNovoEnvio}>
          Enviar outra foto
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
        <p className="mb-1 flex items-center gap-1.5 font-medium text-[var(--color-text)]">
          <Icon name="sparkles" className="h-4 w-4 text-[var(--color-primary)]" />
          Rascunho lido da foto — confira e corrija antes de salvar
        </p>
        {(loja || data) && (
          <p className="mb-1 text-xs text-[var(--color-text-muted)]">
            {loja ? `Loja: ${loja}` : null}
            {loja && data ? " · " : null}
            {data ? `Data: ${data}` : null}
          </p>
        )}
        {observacoes ? <p className="mb-1 text-xs text-[var(--color-text-faint)]">{observacoes}</p> : null}
      </div>

      {linhas.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">A IA não conseguiu identificar itens legíveis nesta foto.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {linhas.map((linha, idx) => (
            <div key={idx} className="grid grid-cols-[auto_1fr_5rem_6rem] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
              <input
                type="checkbox"
                checked={linha.incluir}
                onChange={(e) => atualizarLinha(idx, "incluir", e.currentTarget.checked)}
                aria-label="Incluir este item"
                className="h-4 w-4"
              />
              <div className="flex items-center gap-1.5">
                <Input
                  value={linha.nomeLivre}
                  onChange={(e) => atualizarLinha(idx, "nomeLivre", e.currentTarget.value)}
                  className="!py-1.5 text-sm"
                />
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${CONFIANCA_CLASSE[linha.confianca]}`}>
                  {linha.confianca === "ALTA" ? "alta" : linha.confianca === "MEDIA" ? "média" : "baixa"}
                </span>
              </div>
              <Input
                inputMode="decimal"
                value={linha.quantidade}
                onChange={(e) => atualizarLinha(idx, "quantidade", e.currentTarget.value)}
                placeholder="Qtd"
                className="!py-1.5 text-sm"
              />
              <Input
                inputMode="decimal"
                value={linha.precoUnitario}
                onChange={(e) => atualizarLinha(idx, "precoUnitario", e.currentTarget.value)}
                placeholder="Preço un."
                className="!py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {resultado?.error ? <p className="text-xs text-[var(--color-serious)]">{resultado.error}</p> : null}

      <div className="flex gap-2">
        <Button type="button" icon="check" loading={pending} onClick={confirmar} disabled={linhas.every((l) => !l.incluir)}>
          Confirmar e salvar em Compras
        </Button>
        <Button type="button" variant="secondary" icon="upload" onClick={onNovoEnvio}>
          Descartar e enviar outra
        </Button>
      </div>
      <p className="text-xs text-[var(--color-text-faint)]">
        Nada é gravado até você confirmar — revise nomes, quantidades e preços antes de salvar.
      </p>
    </div>
  );
}
