"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { parseBRLToCents } from "@central-reforma/domain";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { linhaOrcamentoSchema } from "../validation/orcamento";
import type { FormState } from "../obras/actions";
import { valoresDoFormulario } from "../forms/state";

export async function criarLinhaOrcamento(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const parsed = linhaOrcamentoSchema.safeParse({
    categoria: formData.get("categoria"),
    planejado: formData.get("planejado"),
    comprado: formData.get("comprado") || undefined,
    pago: formData.get("pago") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const planejadoCent = parseBRLToCents(parsed.data.planejado);
  if (planejadoCent == null)
    return { fieldErrors: { planejado: "Valor inválido." }, values: valoresDoFormulario(formData) };

  await db.insert(schema.linhasOrcamento).values({
    obraId,
    categoria: parsed.data.categoria,
    planejadoCent,
    compradoCent: parsed.data.comprado ? (parseBRLToCents(parsed.data.comprado) ?? 0) : 0,
    pagoCent: parsed.data.pago ? (parseBRLToCents(parsed.data.pago) ?? 0) : 0,
  });

  revalidatePath("/orcamento");
  return {};
}

export async function atualizarPagoLinhaOrcamento(
  obraId: string,
  linhaId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const pago = String(formData.get("pago") ?? "");
  const comprado = String(formData.get("comprado") ?? "");
  const pagoCent = parseBRLToCents(pago);
  const compradoCent = parseBRLToCents(comprado);
  if (pagoCent == null || compradoCent == null) {
    return { error: "Valores inválidos." };
  }

  await db
    .update(schema.linhasOrcamento)
    .set({ pagoCent, compradoCent })
    .where(and(eq(schema.linhasOrcamento.id, linhaId), eq(schema.linhasOrcamento.obraId, obraId)));

  revalidatePath("/orcamento");
  return {};
}

export async function excluirLinhaOrcamento(obraId: string, linhaId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db
    .delete(schema.linhasOrcamento)
    .where(and(eq(schema.linhasOrcamento.id, linhaId), eq(schema.linhasOrcamento.obraId, obraId)));
  revalidatePath("/orcamento");
}
