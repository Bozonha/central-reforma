import { db, schema } from "@central-reforma/database";
import { inArray } from "drizzle-orm";
import { centsToBRL, resumirOrcamento } from "@central-reforma/domain";
import { requireSession } from "../../lib/auth/actions";
import { obraIdsDoUsuario } from "../../lib/auth/obra-access";
import { Card, CardBody, CardHeader } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { LinkButton } from "../components/ui/button";
import { Icon } from "../components/icons";
import { DashboardOrcamentoChart, type DashboardOrcamentoRow } from "./components/dashboard-orcamento-chart";

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: Parameters<typeof Icon>[0]["name"];
  tone?: "default" | "positive" | "negative";
}) {
  const toneClasses = {
    default: "bg-[var(--color-bg)] text-[var(--color-text-muted)]",
    positive: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
    negative: "bg-[var(--color-serious-soft)] text-[var(--color-serious)]",
  }[tone];

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses}`}>
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">{hint}</p> : null}
      </CardBody>
    </Card>
  );
}

function formatData(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default async function DashboardPage() {
  const sessao = await requireSession();
  const ids = await obraIdsDoUsuario(sessao.usuarioId);

  if (ids.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="dashboard"
          title="Bem-vindo à Central de Reforma"
          description="Crie sua primeira obra para começar a planejar, comprar e acompanhar a reforma de verdade."
          action={
            <LinkButton href="/obras/nova" icon="plus">
              Criar primeira obra
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const [obrasList, linhas, tarefasAbertas, itensPendentes] = await Promise.all([
    db.select().from(schema.obras).where(inArray(schema.obras.id, ids)),
    db.select().from(schema.linhasOrcamento).where(inArray(schema.linhasOrcamento.obraId, ids)),
    db.select().from(schema.tarefas).where(inArray(schema.tarefas.obraId, ids)),
    db.select().from(schema.itensListaCompras).where(inArray(schema.itensListaCompras.obraId, ids)),
  ]);

  const nomeObra = new Map(obrasList.map((o) => [o.id, o.nome]));
  const obrasAtivas = obrasList.filter((o) => o.status === "ATIVA").length;

  const linhasPorObra = new Map<string, typeof linhas>();
  for (const l of linhas) {
    const lista = linhasPorObra.get(l.obraId) ?? [];
    lista.push(l);
    linhasPorObra.set(l.obraId, lista);
  }

  const totalPlanejadoCent = linhas.reduce((acc, l) => acc + l.planejadoCent, 0);
  const totalPagoCent = linhas.reduce((acc, l) => acc + l.pagoCent, 0);
  const percentualGasto = totalPlanejadoCent > 0 ? Math.round((totalPagoCent / totalPlanejadoCent) * 100) : 0;

  const chartData: DashboardOrcamentoRow[] = obrasList
    .filter((o) => linhasPorObra.has(o.id))
    .map((o) => {
      const linhasDaObra = linhasPorObra.get(o.id)!;
      return {
        obra: o.nome,
        planejado: linhasDaObra.reduce((acc, l) => acc + l.planejadoCent, 0),
        pago: linhasDaObra.reduce((acc, l) => acc + l.pagoCent, 0),
      };
    });

  const obrasEstouradas = obrasList.filter((o) => {
    const linhasDaObra = linhasPorObra.get(o.id);
    if (!linhasDaObra || linhasDaObra.length === 0) return false;
    return resumirOrcamento(
      linhasDaObra.map((l) => ({ categoria: l.categoria, planejadoCent: l.planejadoCent, compradoCent: l.compradoCent, pagoCent: l.pagoCent })),
    ).estourado;
  });

  const agora = new Date();
  const tarefasNaoConcluidas = tarefasAbertas.filter((t) => t.status !== "CONCLUIDA");
  const tarefasAtrasadas = tarefasNaoConcluidas.filter((t) => t.fim && t.fim < agora);
  const proximasTarefas = [...tarefasNaoConcluidas]
    .sort((a, b) => (a.fim?.getTime() ?? Infinity) - (b.fim?.getTime() ?? Infinity))
    .slice(0, 6);

  const comprasPendentes = itensPendentes.filter((i) => i.status === "PENDENTE").slice(0, 8);

  const alertas: { texto: string; nivel: "alto" | "medio" }[] = [
    ...obrasEstouradas.map((o) => ({ texto: `Orçamento de "${o.nome}" está estourado.`, nivel: "alto" as const })),
    ...(tarefasAtrasadas.length > 0
      ? [{ texto: `${tarefasAtrasadas.length} tarefa(s) com prazo vencido.`, nivel: "alto" as const }]
      : []),
    ...(comprasPendentes.length > 0
      ? [{ texto: `${itensPendentes.filter((i) => i.status === "PENDENTE").length} item(ns) aguardando compra.`, nivel: "medio" as const }]
      : []),
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Visão geral</h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          {obrasAtivas} {obrasAtivas === 1 ? "obra ativa" : "obras ativas"} · {ids.length} no total
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orçamento planejado" value={centsToBRL(totalPlanejadoCent)} icon="orcamento" />
        <StatCard
          label="Pago até agora"
          value={`${centsToBRL(totalPagoCent)}`}
          hint={`${percentualGasto}% do planejado`}
          icon="trend-up"
          tone={percentualGasto > 100 ? "negative" : "default"}
        />
        <StatCard
          label="Compras pendentes"
          value={`${itensPendentes.filter((i) => i.status === "PENDENTE").length} itens`}
          icon="compras"
        />
        <StatCard
          label="Tarefas em aberto"
          value={`${tarefasNaoConcluidas.length}`}
          hint={tarefasAtrasadas.length > 0 ? `${tarefasAtrasadas.length} atrasada(s)` : undefined}
          icon="cronograma"
          tone={tarefasAtrasadas.length > 0 ? "negative" : "default"}
        />
      </div>

      {chartData.length > 0 ? (
        <Card>
          <CardHeader title="Orçamento por obra" description="Planejado × pago" />
          <CardBody>
            <DashboardOrcamentoChart data={chartData} />
          </CardBody>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Próximas tarefas" />
          <CardBody>
            {proximasTarefas.length === 0 ? (
              <EmptyState icon="cronograma" title="Nenhuma tarefa em aberto" />
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {proximasTarefas.map((tarefa) => (
                  <li key={tarefa.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">{tarefa.titulo}</p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">
                        {nomeObra.get(tarefa.obraId)} {tarefa.responsavel ? `· ${tarefa.responsavel}` : ""}
                      </p>
                    </div>
                    {tarefa.fim ? (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          tarefa.fim < agora
                            ? "bg-[var(--color-serious-soft)] text-[var(--color-serious)]"
                            : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {formatData(tarefa.fim)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Alertas" />
          <CardBody>
            {alertas.length === 0 ? (
              <EmptyState icon="check" title="Tudo em dia" description="Nenhum alerta no momento." />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {alertas.map((alerta, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                      alerta.nivel === "alto"
                        ? "border-[var(--color-serious)]/30 bg-[var(--color-serious-soft)] text-[var(--color-serious)]"
                        : "border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                    }`}
                  >
                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{alerta.texto}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Compras pendentes" />
        <CardBody>
          {comprasPendentes.length === 0 ? (
            <EmptyState icon="compras" title="Nenhuma compra pendente" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                    <th className="py-2 pr-4 font-medium">Item</th>
                    <th className="py-2 pr-4 font-medium">Obra</th>
                    <th className="py-2 font-medium">Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {comprasPendentes.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 pr-4 font-medium text-[var(--color-text)]">{item.nomeLivre ?? "Item sem nome"}</td>
                      <td className="py-2.5 pr-4 text-[var(--color-text-muted)]">{nomeObra.get(item.obraId)}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{item.prioridade}</td>
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
