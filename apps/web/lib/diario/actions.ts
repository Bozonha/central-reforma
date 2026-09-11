"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { entradaDiarioSchema } from "../validation/diario";
import type { FormState } from "../obras/actions";

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function criarEntradaDiario(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const parsed = entradaDiarioSchema.safeParse({
    texto: formData.get("texto"),
    data: formData.get("data") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const data = parseDate(parsed.data.data) ?? new Date();

  await db.insert(schema.diarioEntradas).values({
    obraId,
    texto: parsed.data.texto,
    data,
  });

  revalidatePath("/diario");
  return {};
}

export async function excluirEntradaDiario(obraId: string, entradaId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db.delete(schema.diarioEntradas).where(and(eq(schema.diarioEntradas.id, entradaId), eq(schema.diarioEntradas.obraId, obraId)));
  revalidatePath("/diario");
}
