import { db, schema } from "@central-reforma/database";
import { asc, eq } from "drizzle-orm";
import { PRIORIDADES, STATUS_TAREFA, type StatusTarefa } from "@central-reforma/domain";
import { requireSession } from "../../../lib/auth/actions";
import { resolverObraSelecionada } from "../../../lib/obras/selecionar";
import { criarTarefa, atualizarStatusTarefa, excluirTarefa } from "../../../lib/cronograma/actions";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import { Icon } from "../../components/icons";
import { ObraSelector } from "../components/obra-selector";
import { TarefaForm } from "./components/tarefa-form";
import { Timeline, type TimelineTarefa } from "./components/timeline";

const STATUS_BADGE: Record<StatusTarefa, string> = {
  PENDENTE: "bg-[var(--color-neutral-status-soft)] text-[var(--color-neutral-status)]",
  EM_ANDAMENTO: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  CONCLUIDA: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
  ATRASADA: "bg-[var(--color-serious-soft)] text-[var(--color-serious)]",
};

const PRIORIDADE_LABEL = Object.fromEntries(PRIORIDADES.map((p) => [p.value, p.label]));
const STATUS_LABEL = Object.fromEntries(STATUS_TAREFA.map((s) => [s.value, s.label]));

function formatData(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function CronogramaPage({
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
          icon="cronograma"
          title="Crie uma obra primeiro"
          description="O cronograma é organizado por obra."
          action={
            <LinkButton href="/obras/nova" icon="plus">
              Nova obra
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const tarefas = await db
    .select()
    .from(schema.tarefas)
    .where(eq(schema.tarefas.obraId, obraId))
    .orderBy(asc(schema.tarefas.inicio));

  const concluidas = tarefas.filter((t) => t.status === "CONCLUIDA").length;
  const emAndamento = tarefas.filter((t) => t.status === "EM_ANDAMENTO").length;
  const criarTarefaComObra = criarTarefa.bind(null, obraId);

  const timelineTarefas: TimelineTarefa[] = tarefas
    .filter((t): t is typeof t & { inicio: Date; fim: Date } => t.inicio !== null && t.fim !== null)
    .map((t) => ({
      id: t.id,
      titulo: t.titulo,
      status: t.status as StatusTarefa,
      inicio: t.inicio,
      fim: t.fim,
      percentualConclusao: t.percentualConclusao,
    }));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Cronograma</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Tarefas, responsáveis e prazos da obra.</p>
        </div>
        <ObraSelector obras={obras} obraId={obraId} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Total</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{tarefas.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Em andamento</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-primary)]">{emAndamento}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Concluídas</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-good)]">{concluidas}</p>
          </CardBody>
        </Card>
      </div>

      {timelineTarefas.length > 0 ? (
        <Card>
          <CardHeader title="Linha do tempo" description="Tarefas com início e fim previstos" />
          <CardBody>
            <Timeline tarefas={timelineTarefas} />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Tarefas" />
        <CardBody className="flex flex-col gap-4">
          <TarefaForm action={criarTarefaComObra} />
          {tarefas.length === 0 ? (
            <EmptyState icon="cronograma" title="Nenhuma tarefa ainda" description="Adicione a primeira tarefa acima." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                    <th className="py-2 font-medium">Tarefa</th>
                    <th className="py-2 font-medium">Responsável</th>
                    <th className="py-2 font-medium">Período</th>
                    <th className="py-2 font-medium">Prioridade</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {tarefas.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2.5 font-medium text-[var(--color-text)]">{t.titulo}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{t.responsavel ?? "—"}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">
                        {formatData(t.inicio)} – {formatData(t.fim)}
                      </td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{PRIORIDADE_LABEL[t.prioridade]}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[t.status as StatusTarefa]}`}>
                            {STATUS_LABEL[t.status]}
                          </span>
                          {t.status === "PENDENTE" ? (
                            <form action={async () => { "use server"; await atualizarStatusTarefa(obraId, t.id, "EM_ANDAMENTO"); }}>
                              <button type="submit" className="text-xs text-[var(--color-primary)] hover:underline">
                                Iniciar
                              </button>
                            </form>
                          ) : null}
                          {t.status === "EM_ANDAMENTO" ? (
                            <form action={async () => { "use server"; await atualizarStatusTarefa(obraId, t.id, "CONCLUIDA"); }}>
                              <button type="submit" className="text-xs text-[var(--color-good)] hover:underline">
                                Concluir
                              </button>
                            </form>
                          ) : null}
                          {t.status === "CONCLUIDA" ? (
                            <form action={async () => { "use server"; await atualizarStatusTarefa(obraId, t.id, "PENDENTE"); }}>
                              <button type="submit" className="text-xs text-[var(--color-text-faint)] hover:underline">
                                Reabrir
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <form action={async () => { "use server"; await excluirTarefa(obraId, t.id); }}>
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
