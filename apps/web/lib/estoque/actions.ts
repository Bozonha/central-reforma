"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { itemEstoqueSchema } from "../validation/estoque";
import type { FormState } from "../obras/actions";
import { valoresDoFormulario } from "../forms/state";

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
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const quantidade = Number(parsed.data.quantidade.replace(",", "."));
  if (Number.isNaN(quantidade))
    return { fieldErrors: { quantidade: "Quantidade inválida." }, values: valoresDoFormulario(formData) };

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

  // Ajuste atômico no próprio SQL (GREATEST(0, quantidade + delta)) em vez
  // de ler, calcular em JS e escrever de volta: dois cliques rápidos no
  // mesmo item (ou dois usuários colaborando na mesma obra) podiam pisar um
  // no ajuste do outro, já que o valor lido por um podia estar desatualizado
  // na hora de escrever. O filtro por obraId também volta ao UPDATE, que
  // tinha ficado só no SELECT — sem efeito prático hoje (o SELECT já
  // garantia o escopo), mas mantém o mesmo padrão de defesa em profundidade
  // usado no resto do arquivo (ver excluirItemEstoque).
  await db
    .update(schema.itensEstoque)
    .set({ quantidade: sql`greatest(0, ${schema.itensEstoque.quantidade} + ${delta})` })
    .where(and(eq(schema.itensEstoque.id, itemId), eq(schema.itensEstoque.obraId, obraId)));
  revalidatePath("/estoque");
}

export async function excluirItemEstoque(obraId: string, itemId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db.delete(schema.itensEstoque).where(and(eq(schema.itensEstoque.id, itemId), eq(schema.itensEstoque.obraId, obraId)));
  revalidatePath("/estoque");
}
