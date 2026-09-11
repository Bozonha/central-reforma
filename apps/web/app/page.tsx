import { Icon, type IconName } from "./components/icons";

// ---------------------------------------------------------------------------
// DADOS DE EXEMPLO — este dashboard ainda não está conectado a nenhuma fonte
// de dados real (banco de dados, API etc.). Os valores abaixo são fixos,
// apenas para validar o layout do MVP 0. A integração com dados reais é uma
// etapa futura do roadmap.
// ---------------------------------------------------------------------------
const obraExemplo = {
  nome: "Reforma Apartamento — Vila Mariana",
  progresso: 42,
};

const orcamentoExemplo = {
  planejado: 85000,
  gasto: 36750,
};

const comprasPendentesExemplo = [
  { item: "Porcelanato sala (32m²)", fornecedor: "Portobello", status: "Aguardando pagamento" },
  { item: "Kit torneiras banheiro", fornecedor: "Docol", status: "Cotação em andamento" },
  { item: "Tinta acrílica (18L x 4)", fornecedor: "Suvinil", status: "Pronto para comprar" },
];

const proximasTarefasExemplo = [
  { titulo: "Instalação elétrica — cozinha", prazo: "12/09", responsavel: "Eletricista João" },
  { titulo: "Aprovar projeto do closet", prazo: "14/09", responsavel: "Você" },
  { titulo: "Entrega do porcelanato", prazo: "18/09", responsavel: "Fornecedor" },
  { titulo: "Chumbamento de tubulação", prazo: "20/09", responsavel: "Encanador Carlos" },
];

const alertasExemplo: { texto: string; nivel: "alto" | "medio" }[] = [
  { texto: "Orçamento de acabamentos já usou 68% do previsto.", nivel: "alto" },
  { texto: "Entrega do porcelanato pode atrasar 3 dias.", nivel: "medio" },
  { texto: "2 compras aguardando aprovação há mais de 5 dias.", nivel: "medio" },
];
// ---------------------------------------------------------------------------

const formatBRL = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: IconName;
  tone?: "default" | "positive" | "negative";
}) {
  const toneClasses = {
    default: "bg-slate-100 text-slate-600",
    positive: "bg-emerald-50 text-emerald-600",
    negative: "bg-rose-50 text-rose-600",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses}`}>
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default function Home() {
  const restante = orcamentoExemplo.planejado - orcamentoExemplo.gasto;
  const gastoPercentual = Math.round(
    (orcamentoExemplo.gasto / orcamentoExemplo.planejado) * 100,
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Aviso de dados de exemplo */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
        <Icon name="alert" className="h-4 w-4 shrink-0" />
        <span>
          <strong className="font-semibold">Dados de exemplo.</strong> Este dashboard ainda não
          está conectado a nenhuma obra real.
        </span>
      </div>

      {/* Cabeçalho da obra + progresso */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Obra em andamento
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">{obraExemplo.nome}</h1>
          </div>
          <div className="sm:w-56">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-slate-500">Progresso</span>
              <span className="text-sm font-semibold text-slate-900">
                {obraExemplo.progresso}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900"
                style={{ width: `${obraExemplo.progresso}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orçamento e compras */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orçamento planejado" value={formatBRL(orcamentoExemplo.planejado)} icon="orcamento" />
        <StatCard
          label="Gasto até agora"
          value={`${formatBRL(orcamentoExemplo.gasto)} (${gastoPercentual}%)`}
          icon="trend-up"
          tone="negative"
        />
        <StatCard label="Restante" value={formatBRL(restante)} icon="check" tone="positive" />
        <StatCard
          label="Compras pendentes"
          value={`${comprasPendentesExemplo.length} itens`}
          icon="compras"
        />
      </div>

      {/* Tarefas e alertas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="clock" className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">Próximas tarefas</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {proximasTarefasExemplo.map((tarefa) => (
              <li key={tarefa.titulo} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{tarefa.titulo}</p>
                  <p className="truncate text-xs text-slate-500">{tarefa.responsavel}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {tarefa.prazo}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="alert" className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">Alertas</h2>
          </div>
          <ul className="flex flex-col gap-2.5">
            {alertasExemplo.map((alerta) => (
              <li
                key={alerta.texto}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                  alerta.nivel === "alto"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{alerta.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Compras pendentes */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Icon name="compras" className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Compras pendentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-medium">Item</th>
                <th className="py-2 pr-4 font-medium">Fornecedor</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comprasPendentesExemplo.map((compra) => (
                <tr key={compra.item}>
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{compra.item}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{compra.fornecedor}</td>
                  <td className="py-2.5 text-slate-500">{compra.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
