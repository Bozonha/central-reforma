import { db, schema } from "@central-reforma/database";
import { eq } from "drizzle-orm";
import { centsToBRL, resumirOrcamento } from "@central-reforma/domain";
import { requireSession } from "../../../lib/auth/actions";
import { resolverObraSelecionada } from "../../../lib/obras/selecionar";
import { criarLinhaOrcamento, excluirLinhaOrcamento } from "../../../lib/orcamento/actions";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import { Icon } from "../../components/icons";
import { ObraSelector } from "../components/obra-selector";
import { LinhaOrcamentoForm } from "./components/linha-form";
import { OrcamentoChart } from "./components/orcamento-chart";

export default async function OrcamentoPage({
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
          icon="orcamento"
          title="Crie uma obra primeiro"
          description="O orçamento é organizado por obra."
          action={
            <LinkButton href="/obras/nova" icon="plus">
              Nova obra
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const linhas = await db.select().from(schema.linhasOrcamento).where(eq(schema.linhasOrcamento.obraId, obraId));
  const resumo = resumirOrcamento(
    linhas.map((l) => ({
      categoria: l.categoria,
      planejadoCent: l.planejadoCent,
      compradoCent: l.compradoCent,
      pagoCent: l.pagoCent,
    })),
  );

  const criarLinhaComObra = criarLinhaOrcamento.bind(null, obraId);
  const chartData = linhas.map((l) => ({
    categoria: l.categoria,
    planejado: l.planejadoCent,
    comprado: l.compradoCent,
    pago: l.pagoCent,
  }));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Orçamento</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Planejado, comprado e pago por categoria.</p>
        </div>
        <ObraSelector obras={obras} obraId={obraId} />
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
            <p className="text-xs text-[var(--color-text-faint)]">{resumo.percentualComprado}% do planejado</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Pago</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{centsToBRL(resumo.pagoCent)}</p>
            <p className="text-xs text-[var(--color-text-faint)]">{resumo.percentualPago}% do planejado</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Saldo</p>
            <p className={`mt-1 text-lg font-semibold ${resumo.estourado ? "text-[var(--color-serious)]" : "text-[var(--color-text)]"}`}>
              {centsToBRL(resumo.saldoCent)}
            </p>
            {resumo.estourado ? <p className="text-xs text-[var(--color-serious)]">Orçamento estourado</p> : null}
          </CardBody>
        </Card>
      </div>

      {chartData.length > 0 ? (
        <Card>
          <CardHeader title="Planejado × comprado × pago" />
          <CardBody>
            <OrcamentoChart data={chartData} />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Categorias" />
        <CardBody className="flex flex-col gap-4">
          <LinhaOrcamentoForm action={criarLinhaComObra} />
          {linhas.length === 0 ? (
            <EmptyState icon="orcamento" title="Nenhuma categoria ainda" description="Adicione a primeira categoria de orçamento acima." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                    <th className="py-2 font-medium">Categoria</th>
                    <th className="py-2 font-medium">Planejado</th>
                    <th className="py-2 font-medium">Comprado</th>
                    <th className="py-2 font-medium">Pago</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2.5 font-medium text-[var(--color-text)]">{l.categoria}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{centsToBRL(l.planejadoCent)}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{centsToBRL(l.compradoCent)}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{centsToBRL(l.pagoCent)}</td>
                      <td className="py-2.5 text-right">
                        <form action={excluirLinhaOrcamento.bind(null, obraId, l.id)}>
                          <button type="submit" className="rounded-md p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-serious-soft)] hover:text-[var(--color-serious)]">
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
