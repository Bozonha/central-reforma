import { db, schema } from "@central-reforma/database";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { areaAmbiente, centsToBRL, labelFonteMedida, resumirOrcamento, type FonteMedida } from "@central-reforma/domain";
import { requireSession } from "../../../../lib/auth/actions";
import { requireObraAccess, AcessoNegadoError } from "../../../../lib/auth/obra-access";
import { Card, CardBody, CardHeader } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { EmptyState } from "../../../components/ui/empty-state";
import { LinkButton } from "../../../components/ui/button";
import { Icon } from "../../../components/icons";

function formatQuantidade(q: number) {
  return Number.isInteger(q) ? String(q) : q.toFixed(2).replace(".", ",");
}

export default async function AmbienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await requireSession();

  const [ambiente] = await db.select().from(schema.ambientes).where(eq(schema.ambientes.id, id)).limit(1);
  if (!ambiente) notFound();

  try {
    await requireObraAccess(sessao.usuarioId, ambiente.obraId, "VISUALIZADOR");
  } catch (err) {
    if (err instanceof AcessoNegadoError) notFound();
    throw err;
  }

  const [[obra], linhas, itens] = await Promise.all([
    db.select({ id: schema.obras.id, nome: schema.obras.nome }).from(schema.obras).where(eq(schema.obras.id, ambiente.obraId)).limit(1),
    db.select().from(schema.linhasOrcamento).where(eq(schema.linhasOrcamento.ambienteId, id)),
    db.select().from(schema.itensEstoque).where(eq(schema.itensEstoque.ambienteId, id)),
  ]);

  const area = areaAmbiente(ambiente.largura, ambiente.comprimento);
  const resumo = resumirOrcamento(
    linhas.map((l) => ({
      categoria: l.categoria,
      planejadoCent: l.planejadoCent,
      compradoCent: l.compradoCent,
      pagoCent: l.pagoCent,
    })),
    null,
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <p className="text-xs text-[var(--color-text-faint)]">
          <a href={`/obras/${ambiente.obraId}`} className="hover:text-[var(--color-primary)] hover:underline">
            {obra?.nome ?? "Obra"}
          </a>
        </p>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{ambiente.nome}</h1>
          <Badge tone="neutral">{labelFonteMedida(ambiente.fonteMedida as FonteMedida)}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          {ambiente.largura && ambiente.comprimento ? `${ambiente.largura}m × ${ambiente.comprimento}m` : "Sem dimensões cadastradas"}
          {area != null ? ` · ${area.toFixed(2)} m²` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Planejado</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{centsToBRL(resumo.planejadoCent)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Comprado</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{centsToBRL(resumo.compradoCent)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Pago</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{centsToBRL(resumo.pagoCent)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Itens em estoque</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{itens.length}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Orçamento deste ambiente"
          description="Categorias vinculadas a este cômodo (ver Orçamento para editar)."
        />
        <CardBody>
          {linhas.length === 0 ? (
            <EmptyState
              icon="orcamento"
              title="Nenhuma categoria vinculada"
              description="Vincule uma categoria a este ambiente na tela de Orçamento."
              action={
                <LinkButton href={`/orcamento?obraId=${ambiente.obraId}`} icon="orcamento">
                  Ir para Orçamento
                </LinkButton>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                    <th className="py-2 font-medium">Categoria</th>
                    <th className="py-2 font-medium">Planejado</th>
                    <th className="py-2 font-medium">Comprado</th>
                    <th className="py-2 font-medium">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2.5 font-medium text-[var(--color-text)]">{l.categoria}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{centsToBRL(l.planejadoCent)}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{centsToBRL(l.compradoCent)}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{centsToBRL(l.pagoCent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Estoque deste ambiente" description="Itens vinculados a este cômodo (ver Estoque para editar)." />
        <CardBody>
          {itens.length === 0 ? (
            <EmptyState
              icon="estoque"
              title="Nenhum item vinculado"
              description="Vincule um item a este ambiente na tela de Estoque."
              action={
                <LinkButton href={`/estoque?obraId=${ambiente.obraId}`} icon="estoque">
                  Ir para Estoque
                </LinkButton>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                    <th className="py-2 font-medium">Item</th>
                    <th className="py-2 font-medium">Quantidade</th>
                    <th className="py-2 font-medium">Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2.5 font-medium text-[var(--color-text)]">{item.nomeLivre ?? "Item sem nome"}</td>
                      <td className={`py-2.5 ${item.quantidade === 0 ? "text-[var(--color-warning)]" : "text-[var(--color-text-muted)]"}`}>
                        {formatQuantidade(item.quantidade)}
                      </td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{item.unidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <div>
        <a href={`/obras/${ambiente.obraId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline">
          <Icon name="chevron-right" className="h-3.5 w-3.5 rotate-180" />
          Voltar para {obra?.nome ?? "a obra"}
        </a>
      </div>
    </div>
  );
}
