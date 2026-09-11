"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { itemEstoqueSchema } from "../validation/estoque";
import type { FormState } from "../obras/actions";

export async function criarItemEstoque(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const parsed = itemEstoqueSchema.safeParse({
    nomeLivre: formData.get("nomeLivre"),
    quantidade: formData.get("quantidade"),
    unidade: formData.get("unidade"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const quantidade = Number(parsed.data.quantidade.replace(",", "."));
  if (Number.isNaN(quantidade)) return { fieldErrors: { quantidade: "Quantidade inválida." } };

  await db.insert(schema.itensEstoque).values({
    obraId,
    nomeLivre: parsed.data.nomeLivre,
    quantidade,
    unidade: parsed.data.unidade,
    origem: "MANUAL",
  });

  revalidatePath("/estoque");
  return {};
}

export async function ajustarQuantidadeEstoque(obraId: string, itemId: string, delta: number): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const [item] = await db
    .select()
    .from(schema.itensEstoque)
    .where(and(eq(schema.itensEstoque.id, itemId), eq(schema.itensEstoque.obraId, obraId)))
    .limit(1);
  if (!item) return;

  const novaQuantidade = Math.max(0, item.quantidade + delta);
  await db.update(schema.itensEstoque).set({ quantidade: novaQuantidade }).where(eq(schema.itensEstoque.id, itemId));
  revalidatePath("/estoque");
}

export async function excluirItemEstoque(obraId: string, itemId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db.delete(schema.itensEstoque).where(and(eq(schema.itensEstoque.id, itemId), eq(schema.itensEstoque.obraId, obraId)));
  revalidatePath("/estoque");
}
