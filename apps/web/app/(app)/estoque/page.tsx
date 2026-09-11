import { db, schema } from "@central-reforma/database";
import { desc, eq } from "drizzle-orm";
import { requireSession } from "../../../lib/auth/actions";
import { resolverObraSelecionada } from "../../../lib/obras/selecionar";
import { criarItemEstoque, ajustarQuantidadeEstoque, excluirItemEstoque } from "../../../lib/estoque/actions";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import { Icon } from "../../components/icons";
import { ObraSelector } from "../components/obra-selector";
import { ItemEstoqueForm } from "./components/item-form";

function formatQuantidade(q: number) {
  return Number.isInteger(q) ? String(q) : q.toFixed(2).replace(".", ",");
}

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ obraId?: string }>;
}) {
  const sessao = await requireSession();
  const { obraId: obraIdParam } = await searchParams;
  const { obras, obraId } = await resolverObraSelecionada(sessao.usuarioId, obraIdParam);

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

  const itens = await db
    .select()
    .from(schema.itensEstoque)
    .where(eq(schema.itensEstoque.obraId, obraId))
    .orderBy(desc(schema.itensEstoque.atualizadoEm));

  const semEstoque = itens.filter((i) => i.quantidade === 0).length;
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
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{itens.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Com estoque</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{itens.length - semEstoque}</p>
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
          <ItemEstoqueForm action={criarItemComObra} />
          {itens.length === 0 ? (
            <EmptyState icon="estoque" title="Nenhum item ainda" description="Adicione o primeiro item de estoque acima." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                    <th className="py-2 font-medium">Item</th>
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
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
