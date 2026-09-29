import { db, schema } from "@central-reforma/database";
import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import { requireSession } from "../../../lib/auth/actions";
import { resolverObraSelecionada } from "../../../lib/obras/selecionar";
import { criarItemEstoque, ajustarQuantidadeEstoque, excluirItemEstoque } from "../../../lib/estoque/actions";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import { Icon } from "../../components/icons";
import { ObraSelector } from "../components/obra-selector";
import { BuscaInline } from "../components/busca-inline";
import { Pagination, parsePagina } from "../../components/ui/pagination";
import { ItemEstoqueForm } from "./components/item-form";

const TAMANHO_PAGINA = 20;

function formatQuantidade(q: number) {
  return Number.isInteger(q) ? String(q) : q.toFixed(2).replace(".", ",");
}

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ obraId?: string; pagina?: string; q?: string }>;
}) {
  const sessao = await requireSession();
  const { obraId: obraIdParam, pagina: paginaParam, q: qParam } = await searchParams;
  const { obras, obraId } = await resolverObraSelecionada(sessao.usuarioId, obraIdParam);
  const pagina = parsePagina(paginaParam);
  const q = qParam?.trim() || undefined;

  if (!obraId) {
    return (
      <Card>
        <EmptyState
          icon="estoque"
          title="Crie uma obra primeiro"
          description="O estoque é organizado por obra."
          action={
            <LinkButton href="/obras/nova" icon="plus">
              Nova obra
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const condicoesFiltro = [eq(schema.itensEstoque.obraId, obraId)];
  if (q) condicoesFiltro.push(ilike(schema.itensEstoque.nomeLivre, `%${q}%`));
  const filtro = and(...condicoesFiltro);

  const [linhasBuscadas, ambientes, [totais]] = await Promise.all([
    db
      .select()
      .from(schema.itensEstoque)
      .where(filtro)
      .orderBy(desc(schema.itensEstoque.atualizadoEm))
      .limit(TAMANHO_PAGINA + 1)
      .offset((pagina - 1) * TAMANHO_PAGINA),
    db.select({ id: schema.ambientes.id, nome: schema.ambientes.nome }).from(schema.ambientes).where(eq(schema.ambientes.obraId, obraId)),
    // Cartões de resumo sempre refletem a obra inteira, não a página/busca
    // atual — um COUNT agregado em vez de carregar tudo para contar em JS.
    db
      .select({
        total: count(),
        zerados: sql<number>`count(*) filter (where ${schema.itensEstoque.quantidade} = 0)`.mapWith(Number),
      })
      .from(schema.itensEstoque)
      .where(eq(schema.itensEstoque.obraId, obraId)),
  ]);
  const temProximaPagina = linhasBuscadas.length > TAMANHO_PAGINA;
  const itens = linhasBuscadas.slice(0, TAMANHO_PAGINA);
  const ambienteNome = new Map(ambientes.map((a) => [a.id, a.nome]));

  const semEstoque = totais?.zerados ?? 0;
  const totalItens = totais?.total ?? 0;
  const criarItemComObra = criarItemEstoque.bind(null, obraId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Estoque</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Materiais disponíveis na obra.</p>
        </div>
        <ObraSelector obras={obras} obraId={obraId} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Itens cadastrados</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{totalItens}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Com estoque</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{totalItens - semEstoque}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Zerados</p>
            <p className={`mt-1 text-lg font-semibold ${semEstoque > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-text)]"}`}>
              {semEstoque}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Itens" />
        <CardBody className="flex flex-col gap-4">
          <ItemEstoqueForm action={criarItemComObra} ambientes={ambientes} />
          {totalItens > 0 ? (
            <BuscaInline obraId={obraId} valorAtual={q} placeholder="Buscar item…" action="/estoque" />
          ) : null}
          {itens.length === 0 ? (
            <EmptyState
              icon="estoque"
              title={q ? "Nenhum item encontrado" : "Nenhum item ainda"}
              description={q ? `Nada bate com "${q}".` : "Adicione o primeiro item de estoque acima."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                    <th className="py-2 font-medium">Item</th>
                    <th className="py-2 font-medium">Ambiente</th>
                    <th className="py-2 font-medium">Quantidade</th>
                    <th className="py-2 font-medium">Unidade</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2.5 font-medium text-[var(--color-text)]">{item.nomeLivre ?? "Item sem nome"}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">
                        {item.ambienteId ? ambienteNome.get(item.ambienteId) ?? "—" : "Obra toda"}
                      </td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">
                        <div className="flex items-center gap-2">
                          <form action={async () => { "use server"; await ajustarQuantidadeEstoque(obraId, item.id, -1); }}>
                            <button
                              type="submit"
                              disabled={item.quantidade <= 0}
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Diminuir quantidade"
                            >
                              −
                            </button>
                          </form>
                          <span
                            className={`min-w-[2.5rem] text-center font-medium ${
                              item.quantidade === 0 ? "text-[var(--color-warning)]" : "text-[var(--color-text)]"
                            }`}
                          >
                            {formatQuantidade(item.quantidade)}
                          </span>
                          <form action={async () => { "use server"; await ajustarQuantidadeEstoque(obraId, item.id, 1); }}>
                            <button
                              type="submit"
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                              aria-label="Aumentar quantidade"
                            >
                              +
                            </button>
                          </form>
                        </div>
                      </td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{item.unidade}</td>
                      <td className="py-2.5 text-right">
                        <form action={async () => { "use server"; await excluirItemEstoque(obraId, item.id); }}>
                          <button
                            type="submit"
                            className="rounded-md p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-serious-soft)] hover:text-[var(--color-serious)]"
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                paginaAtual={pagina}
                temProximaPagina={temProximaPagina}
                buildHref={(p) => `/estoque?obraId=${obraId}${q ? `&q=${encodeURIComponent(q)}` : ""}&pagina=${p}`}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
