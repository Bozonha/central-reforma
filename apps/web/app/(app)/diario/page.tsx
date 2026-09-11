import { db, schema } from "@central-reforma/database";
import { desc, eq } from "drizzle-orm";
import { requireSession } from "../../../lib/auth/actions";
import { resolverObraSelecionada } from "../../../lib/obras/selecionar";
import { criarEntradaDiario, excluirEntradaDiario } from "../../../lib/diario/actions";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import { Icon } from "../../components/icons";
import { ObraSelector } from "../components/obra-selector";
import { EntradaDiarioForm } from "./components/entrada-form";

function formatData(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export default async function DiarioPage({
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
          icon="diario"
          title="Crie uma obra primeiro"
          description="O diário é organizado por obra."
          action={
            <LinkButton href="/obras/nova" icon="plus">
              Nova obra
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const entradas = await db
    .select()
    .from(schema.diarioEntradas)
    .where(eq(schema.diarioEntradas.obraId, obraId))
    .orderBy(desc(schema.diarioEntradas.data));

  const criarEntradaComObra = criarEntradaDiario.bind(null, obraId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Diário da obra</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Registro do dia a dia da reforma.</p>
        </div>
        <ObraSelector obras={obras} obraId={obraId} />
      </div>

      <Card>
        <CardHeader title="Nova entrada" />
        <CardBody>
          <EntradaDiarioForm action={criarEntradaComObra} />
        </CardBody>
      </Card>

      {entradas.length === 0 ? (
        <Card>
          <EmptyState icon="diario" title="Nenhuma entrada ainda" description="Registre o primeiro dia acima." />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {entradas.map((entrada) => (
            <Card key={entrada.id}>
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-medium capitalize text-[var(--color-text-muted)]">{formatData(entrada.data)}</p>
                  <form action={excluirEntradaDiario.bind(null, obraId, entrada.id)}>
                    <button
                      type="submit"
                      className="rounded-md p-1 text-[var(--color-text-faint)] hover:bg-[var(--color-serious-soft)] hover:text-[var(--color-serious)]"
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
                <p className="whitespace-pre-wrap text-sm text-[var(--color-text)]">{entrada.texto}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
