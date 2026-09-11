import { db, schema } from "@central-reforma/database";
import { inArray } from "drizzle-orm";
import { centsToBRL, OBRA_TIPOS, percentOf, resumirOrcamento } from "@central-reforma/domain";
import { requireSession } from "../../lib/auth/actions";
import { obraIdsDoUsuario } from "../../lib/auth/obra-access";
import { Card, CardBody, CardHeader } from "../components/ui/card";
import { Badge, statusToneMap } from "../components/ui/badge";
import { LinkButton } from "../components/ui/button";
import { EmptyState } from "../components/ui/empty-state";
import { Icon, type IconName } from "../components/icons";
import { DashboardOrcamentoChart } from "./components/dashboard-orcamento-chart";
import Link from "next/link";

function formatData(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: IconName;
  tone?: "default" | "positive" | "negative";
}) {
  const toneClasses = {
    default: "bg-[var(--color-neutral-status-soft)] text-[var(--color-neutral-status)]",
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
        <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          {value}
          {sublabel ? <span className="ml-1 text-sm font-normal text-[var(--color-text-muted)]">{sublabel}</span> : null}
        </p>
      </CardBody>
    </Card>
  );
}

export default async function DashboardPage() {
  const sessao = await requireSession();
  const obraIds = await obraIdsDoUsuario(sessao.usuarioId);

  if (obraIds.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="dashboard"
          title="Crie sua primeira obra"
          description="O dashboard mostra o progresso, orçamento e alertas assim que você tiver uma obra cadastrada."
          action={
            <LinkButton href="/obras/nova" icon="plus">
              Nova obra
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const todasObras = await db.select().from(schema.obras).where(inArray(schema.obras.id, obraIds));
  const obrasAtivas = todasObras.filter((o) => o.status === "ATIVA");
  const obrasBase = obrasAtivas.length > 0 ? obrasAtivas : todasObras;
  const obraIdsBase = obrasBase.map((o) => o.id);
  const obraNome = new Map(obrasBase.map((o) => [o.id, o.nome]));

  const [linhas, itensPendentes, tarefas] = await Promise.all([
    db.select().from(schema.linhasOrcamento).where(inArray(schema.linhasOrcamento.obraId, obraIdsBase)),
    db.select().from(schema.itensListaCompras).where(inArray(schema.itensListaCompras.obraId, obraIdsBase)),
    db.select().from(schema.tarefas).where(inArray(schema.tarefas.obraId, obraIdsBase)),
  ]);

  const itensListaPendentes = itensPendentes.filter((i) => i.status === "PENDENTE");

  const resumoGeral = resumirOrcamento(
    linhas.map((l) => ({ categoria: l.categoria, planejadoCent: l.planejadoCent, compradoCent: l.compradoCent, pagoCent: l.pagoCent })),
  );

  // Gráfico planejado × pago por obra (mesmo componente usado no roadmap original,
  // até agora não conectado a nenhuma página real).
  const chartData = obrasBase
    .map((o) => {
      const linhasObra = linhas.filter((l) => l.obraId === o.id);
      if (linhasObra.length === 0) return null;
      const resumo = resumirOrcamento(
        linhasObra.map((l) => ({ categoria: l.categoria, planejadoCent: l.planejadoCent, compradoCent: l.compradoCent, pagoCent: l.pagoCent })),
      );
      return { obra: o.nome, planejado: resumo.planejadoCent, pago: resumo.pagoCent };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Obra em destaque no cabeçalho: a ativa mais recentemente atualizada.
  const obraDestaque = [...obrasAtivas].sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime())[0] ?? obrasBase[0];
  const tarefasDaDestaque = tarefas.filter((t) => t.obraId === obraDestaque?.id);
  const progresso =
    tarefasDaDestaque.length > 0
      ? Math.round((tarefasDaDestaque.filter((t) => t.status === "CONCLUIDA").length / tarefasDaDestaque.length) * 100)
      : null;

  const proximasTarefas = tarefas
    .filter((t) => t.status !== "CONCLUIDA" && t.fim !== null)
    .sort((a, b) => a.fim!.getTime() - b.fim!.getTime())
    .slice(0, 5);

  // Alertas — sempre derivados de dados reais, nunca "impressão" da IA
  // (CLAUDE.md #1/#3): cada mensagem é calculada por regra determinística.
  const hoje = new Date();
  const alertas: { texto: string; nivel: "alto" | "medio" }[] = [];

  for (const l of linhas) {
    if (l.planejadoCent <= 0) continue;
    const pct = percentOf(l.compradoCent, l.planejadoCent);
    if (pct >= 100) {
      alertas.push({
        texto: `Orçamento de "${l.categoria}"${obrasBase.length > 1 ? ` (${obraNome.get(l.obraId)})` : ""} já ultrapassou o previsto (${pct}%).`,
        nivel: "alto",
      });
    } else if (pct >= 80) {
      alertas.push({
        texto: `Orçamento de "${l.categoria}"${obrasBase.length > 1 ? ` (${obraNome.get(l.obraId)})` : ""} já usou ${pct}% do previsto.`,
        nivel: "medio",
      });
    }
  }

  for (const t of tarefas) {
    if (t.status !== "CONCLUIDA" && t.fim && t.fim < hoje) {
      alertas.push({
        texto: `"${t.titulo}"${obrasBase.length > 1 ? ` (${obraNome.get(t.obraId)})` : ""} está atrasada — previsto para ${formatData(t.fim)}.`,
        nivel: "alto",
      });
    }
  }

  const cincoDiasAtras = new Date(hoje.getTime() - 5 * 24 * 60 * 60 * 1000);
  const pendentesAntigos = itensListaPendentes.filter((i) => i.criadoEm < cincoDiasAtras);
  if (pendentesAntigos.length > 0) {
    alertas.push({
      texto: `${pendentesAntigos.length} ${pendentesAntigos.length === 1 ? "item está pendente" : "itens estão pendentes"} na lista de compras há mais de 5 dias.`,
      nivel: "medio",
    });
  }

  alertas.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === "alto" ? -1 : 1));

  const tipoLabel = obraDestaque ? OBRA_TIPOS.find((t) => t.value === obraDestaque.tipo)?.label ?? obraDestaque.tipo : "";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {obraDestaque ? (
        <Card>
          <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                  {obrasBase.length > 1 ? "Obra em destaque" : "Obra em andamento"}
                </p>
                <Badge tone={statusToneMap(obraDestaque.status)}>{obraDestaque.status === "ATIVA" ? "Ativa" : "Arquivada"}</Badge>
              </div>
              <Link href={`/obras/${obraDestaque.id}`} className="mt-1 block text-xl font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                {obraDestaque.nome}
              </Link>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                {tipoLabel}
                {obraDestaque.cidade ? ` · ${obraDestaque.cidade}${obraDestaque.estado ? `, ${obraDestaque.estado}` : ""}` : ""}
              </p>
            </div>
            {progresso !== null ? (
              <div className="sm:w-56">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">Progresso (tarefas)</span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">{progresso}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${progresso}%` }} />
                </div>
              </div>
            ) : null}
            {obrasBase.length > 1 ? (
              <Link href="/obras" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                Ver todas as obras ({obrasBase.length})
              </Link>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orçamento planejado" value={centsToBRL(resumoGeral.planejadoCent)} icon="orcamento" />
        <StatCard
          label="Gasto até agora (pago)"
          value={centsToBRL(resumoGeral.pagoCent)}
          sublabel={`(${resumoGeral.percentualPago}%)`}
          icon="trend-up"
          tone={resumoGeral.estourado ? "negative" : "default"}
        />
        <StatCard label="Restante" value={centsToBRL(resumoGeral.saldoCent)} icon="check" tone="positive" />
        <StatCard label="Compras pendentes" value={`${itensListaPendentes.length} ${itensListaPendentes.length === 1 ? "item" : "itens"}`} icon="compras" />
      </div>

      {chartData.length > 0 ? (
        <Card>
          <CardHeader title="Planejado × pago por obra" />
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
              <EmptyState icon="clock" title="Nenhuma tarefa com prazo definido" description="Cadastre tarefas no Cronograma para vê-las aqui." />
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {proximasTarefas.map((tarefa) => (
                  <li key={tarefa.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">{tarefa.titulo}</p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">
                        {tarefa.responsavel ?? "Sem responsável"}
                        {obrasBase.length > 1 ? ` · ${obraNome.get(tarefa.obraId)}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--color-neutral-status-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-neutral-status)]">
                      {formatData(tarefa.fim)}
                    </span>
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
              <EmptyState icon="check" title="Nenhum alerta no momento" description="Avisamos aqui sobre orçamento estourado, tarefas atrasadas e compras paradas." />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {alertas.slice(0, 6).map((alerta, i) => (
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
    </div>
  );
}
