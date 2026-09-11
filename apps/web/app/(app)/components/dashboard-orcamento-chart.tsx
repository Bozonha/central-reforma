"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { centsToBRL } from "@central-reforma/domain";

export interface DashboardOrcamentoRow {
  obra: string;
  planejado: number;
  pago: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-[var(--shadow-raised)]">
      <p className="mb-1 font-medium text-[var(--color-text)]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-[var(--color-text-muted)]">{p.name}:</span>
          <span className="font-medium text-[var(--color-text)]">{centsToBRL(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardOrcamentoChart({ data }: { data: DashboardOrcamentoRow[] }) {
  if (data.length === 0) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="obra"
            tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            axisLine={{ stroke: "var(--chart-grid)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${Math.round(v / 100 / 1000)}k`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-bg)" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)" }} />
          <Bar dataKey="planejado" name="Planejado" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pago" name="Pago" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
