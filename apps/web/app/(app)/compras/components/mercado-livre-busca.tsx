"use client";

import { useState, useTransition } from "react";
import { centsToBRL } from "@central-reforma/domain";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select } from "../../../components/ui/form";
import type { BuscaMercadoLivreResultado, ResultadoBuscaMercadoLivre } from "../../../../lib/mercado/mercadolivre/client";
import type { OpcaoSelect } from "./compra-form";

export function MercadoLivreBusca({
  produtos,
  conectado,
  buscar,
  importar,
}: {
  produtos: OpcaoSelect[];
  conectado: boolean;
  buscar: (query: string) => Promise<BuscaMercadoLivreResultado>;
  importar: (produtoId: string, resultado: ResultadoBuscaMercadoLivre) => Promise<{ error?: string }>;
}) {
  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoBuscaMercadoLivre[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [importadoId, setImportadoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!conectado) {
    return (
      <p className="text-xs text-[var(--color-text-faint)]">
        Conecte sua conta do Mercado Livre acima para buscar preços reais de vendedores (incluindo grandes redes que também vendem por lá).
      </p>
    );
  }

  if (produtos.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-faint)]">Cadastre pelo menos um produto acima para poder importar um preço do Mercado Livre.</p>
    );
  }

  function handleBuscar() {
    setErro(null);
    startTransition(async () => {
      const resposta = await buscar(query);
      if (!resposta.ok) {
        setErro(
          resposta.motivo === "nao_conectado"
            ? "A conexão com o Mercado Livre expirou ou foi revogada — reconecte acima."
            : resposta.motivo === "sem_configuracao"
              ? "Integração com o Mercado Livre não configurada neste ambiente."
              : (resposta.detalhe ?? "Não foi possível buscar agora."),
        );
        setResultados(null);
        return;
      }
      setResultados(resposta.resultados);
    });
  }

  function handleImportar(r: ResultadoBuscaMercadoLivre) {
    startTransition(async () => {
      const resposta = await importar(produtoId, r);
      if (resposta.error) {
        setErro(resposta.error);
        return;
      }
      setImportadoId(r.mlId);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_auto]">
        <Field label="Produto do catálogo" htmlFor="ml-produto">
          <Select id="ml-produto" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Buscar no Mercado Livre" htmlFor="ml-query">
          <Input
            id="ml-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="porcelanato acetinado 60x60"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleBuscar();
              }
            }}
          />
        </Field>
        <div className="flex items-end">
          <Button type="button" fullWidth onClick={handleBuscar} loading={pending} disabled={!produtoId || !query.trim()}>
            Buscar
          </Button>
        </div>
      </div>

      {erro ? <p className="text-xs text-[var(--color-serious)]">{erro}</p> : null}

      {resultados ? (
        resultados.length === 0 ? (
          <p className="text-xs text-[var(--color-text-faint)]">Nenhum resultado para essa busca.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {resultados.map((r) => (
              <li
                key={r.mlId}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <a
                    href={r.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] hover:underline"
                  >
                    {r.titulo}
                  </a>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {centsToBRL(r.precoCent)}
                    {r.condicao ? ` · ${r.condicao === "new" ? "novo" : r.condicao === "used" ? "usado" : r.condicao}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleImportar(r)}
                  disabled={pending || importadoId === r.mlId}
                >
                  {importadoId === r.mlId ? "Importado" : "Importar como oferta"}
                </Button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
