"use server";

import { db, schema } from "@central-reforma/database";
import type { StatusTarefa } from "@central-reforma/domain";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { tarefaSchema } from "../validation/cronograma";
import type { FormState } from "../obras/actions";
import { valoresDoFormulario } from "../forms/state";

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function diasEntre(inicio?: Date, fim?: Date): number | undefined {
  if (!inicio || !fim) return undefined;
  const ms = fim.getTime() - inicio.getTime();
  if (ms < 0) return undefined;
  return Math.round(ms / (1000 * 60 * 60 * 24)) || 1;
}

export async function criarTarefa(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const parsed = tarefaSchema.safeParse({
    titulo: formData.get("titulo"),
    responsavel: formData.get("responsavel") || undefined,
    inicio: formData.get("inicio") || undefined,
    fim: formData.get("fim") || undefined,
    prioridade: formData.get("prioridade") || "MEDIA",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const inicio = parseDate(parsed.data.inicio);
  const fim = parseDate(parsed.data.fim);
  const values = valoresDoFormulario(formData);
  if (parsed.data.inicio && !inicio) return { fieldErrors: { inicio: "Data inválida." }, values };
  if (parsed.data.fim && !fim) return { fieldErrors: { fim: "Data inválida." }, values };
  if (inicio && fim && fim < inicio) return { fieldErrors: { fim: "Fim não pode ser antes do início." }, values };

  await db.insert(schema.tarefas).values({
    obraId,
    titulo: parsed.data.titulo,
    responsavel: parsed.data.responsavel ?? null,
    inicio: inicio ?? null,
    fim: fim ?? null,
    duracaoDias: diasEntre(inicio, fim) ?? null,
    prioridade: parsed.data.prioridade,
    status: "PENDENTE",
    percentualConclusao: 0,
  });

  revalidatePath("/cronograma");
  return {};
}

export async function atualizarStatusTarefa(obraId: string, tarefaId: string, novoStatus: StatusTarefa): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const percentualConclusao = novoStatus === "CONCLUIDA" ? 100 : novoStatus === "PENDENTE" ? 0 : undefined;

  await db
    .update(schema.tarefas)
    .set({
      status: novoStatus,
      ...(percentualConclusao !== undefined ? { percentualConclusao } : {}),
    })
    .where(and(eq(schema.tarefas.id, tarefaId), eq(schema.tarefas.obraId, obraId)));

  revalidatePath("/cronograma");
}

export async function excluirTarefa(obraId: string, tarefaId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db.delete(schema.tarefas).where(and(eq(schema.tarefas.id, tarefaId), eq(schema.tarefas.obraId, obraId)));
  revalidatePath("/cronograma");
}
