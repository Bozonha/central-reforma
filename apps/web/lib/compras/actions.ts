"use server";

import { db, schema } from "@central-reforma/database";
import type { StatusItemCompra } from "@central-reforma/domain";
import { reaisToCents } from "@central-reforma/domain";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { itemListaSchema, compraSchema } from "../validation/compras";
import type { FormState } from "../obras/actions";

function parseNumberInput(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(",", "."));
  return Number.isNaN(n) ? undefined : n;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// ---------------------------------------------------------------------------
// Lista de compras (obra-scoped)
// ---------------------------------------------------------------------------

export async function criarItemLista(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const parsed = itemListaSchema.safeParse({
    nomeLivre: formData.get("nomeLivre"),
    quantidadeNecessaria: formData.get("quantidadeNecessaria"),
    prioridade: formData.get("prioridade") || "MEDIA",
    etapa: formData.get("etapa") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const quantidade = parseNumberInput(parsed.data.quantidadeNecessaria);
  if (quantidade === undefined) return { fieldErrors: { quantidadeNecessaria: "Quantidade inválida." } };

  await db.insert(schema.itensListaCompras).values({
    obraId,
    nomeLivre: parsed.data.nomeLivre,
    quantidadeNecessaria: quantidade,
    prioridade: parsed.data.prioridade,
    etapa: parsed.data.etapa ?? null,
    status: "PENDENTE",
  });

  revalidatePath("/compras");
  return {};
}

export async function atualizarStatusItemLista(obraId: string, itemId: string, status: StatusItemCompra): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db
    .update(schema.itensListaCompras)
    .set({ status })
    .where(and(eq(schema.itensListaCompras.id, itemId), eq(schema.itensListaCompras.obraId, obraId)));
  revalidatePath("/compras");
}

export async function excluirItemLista(obraId: string, itemId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db
    .delete(schema.itensListaCompras)
    .where(and(eq(schema.itensListaCompras.id, itemId), eq(schema.itensListaCompras.obraId, obraId)));
  revalidatePath("/compras");
}

// ---------------------------------------------------------------------------
// Registro de compras (obra-scoped) — o que já foi efetivamente comprado.
// ---------------------------------------------------------------------------

export async function criarCompra(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const parsed = compraSchema.safeParse({
    nomeLivre: formData.get("nomeLivre"),
    produtoId: formData.get("produtoId") || undefined,
    lojaId: formData.get("lojaId") || undefined,
    quantidade: formData.get("quantidade"),
    precoUnitario: formData.get("precoUnitario"),
    formaPagamento: formData.get("formaPagamento") || undefined,
    data: formData.get("data") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const quantidade = parseNumberInput(parsed.data.quantidade);
  if (quantidade === undefined) return { fieldErrors: { quantidade: "Quantidade inválida." } };
  const precoUnitarioCent = reaisToCents(parseNumberInput(parsed.data.precoUnitario) ?? -1);
  if (precoUnitarioCent < 0) return { fieldErrors: { precoUnitario: "Preço inválido." } };

  const valorTotalCent = Math.round(precoUnitarioCent * quantidade);
  const data = parseDate(parsed.data.data) ?? new Date();

  const itemListaComprasId = formData.get("itemListaComprasId");

  await db.insert(schema.compras).values({
    obraId,
    itemListaComprasId: itemListaComprasId ? String(itemListaComprasId) : null,
    produtoId: parsed.data.produtoId ?? null,
    lojaId: parsed.data.lojaId ?? null,
    nomeLivre: parsed.data.nomeLivre,
    quantidade,
    precoUnitarioCent,
    valorTotalCent,
    formaPagamento: parsed.data.formaPagamento ?? null,
    data,
  });

  if (parsed.data.produtoId && parsed.data.lojaId) {
    await db.insert(schema.priceObservations).values({
      produtoId: parsed.data.produtoId,
      lojaId: parsed.data.lojaId,
      precoCent: precoUnitarioCent,
      fonte: "COMPRA_REGISTRADA",
    });
  }

  if (itemListaComprasId) {
    await db
      .update(schema.itensListaCompras)
      .set({ status: "COMPRADO" })
      .where(and(eq(schema.itensListaCompras.id, String(itemListaComprasId)), eq(schema.itensListaCompras.obraId, obraId)));
  }

  revalidatePath("/compras");
  return {};
}

export async function excluirCompra(obraId: string, compraId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db.delete(schema.compras).where(and(eq(schema.compras.id, compraId), eq(schema.compras.obraId, obraId)));
  revalidatePath("/compras");
}
