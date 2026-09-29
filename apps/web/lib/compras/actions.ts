"use server";

import { db, schema } from "@central-reforma/database";
import type { StatusItemCompra } from "@central-reforma/domain";
import { reaisToCents } from "@central-reforma/domain";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { itemListaSchema, compraSchema } from "../validation/compras";
import type { FormState } from "../obras/actions";
import { valoresDoFormulario } from "../forms/state";

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
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const quantidade = parseNumberInput(parsed.data.quantidadeNecessaria);
  if (quantidade === undefined)
    return { fieldErrors: { quantidadeNecessaria: "Quantidade inválida." }, values: valoresDoFormulario(formData) };

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
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const quantidade = parseNumberInput(parsed.data.quantidade);
  if (quantidade === undefined)
    return { fieldErrors: { quantidade: "Quantidade inválida." }, values: valoresDoFormulario(formData) };
  const precoUnitarioCent = reaisToCents(parseNumberInput(parsed.data.precoUnitario) ?? -1);
  if (precoUnitarioCent < 0)
    return { fieldErrors: { precoUnitario: "Preço inválido." }, values: valoresDoFormulario(formData) };

  const valorTotalCent = Math.round(precoUnitarioCent * quantidade);
  const data = parseDate(parsed.data.data) ?? new Date();

  const itemListaComprasId = formData.get("itemListaComprasId");

  // Até 3 gravações relacionadas (compra + observação de preço + status do
  // item da lista) — agrupadas num único `db.batch` para que sejam atômicas.
  // O driver `neon-http` não tem `db.transaction()` (é stateless por
  // requisição HTTP), mas `db.batch([...])` envolve as queries numa
  // transação real do Postgres via `client.transaction(...)` internamente.
  const queries: BatchItem<"pg">[] = [
    db.insert(schema.compras).values({
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
    }),
  ];

  if (parsed.data.produtoId && parsed.data.lojaId) {
    queries.push(
      db.insert(schema.priceObservations).values({
        produtoId: parsed.data.produtoId,
        lojaId: parsed.data.lojaId,
        precoCent: precoUnitarioCent,
        fonte: "COMPRA_REGISTRADA",
      }),
    );
  }

  if (itemListaComprasId) {
    queries.push(
      db
        .update(schema.itensListaCompras)
        .set({ status: "COMPRADO" })
        .where(and(eq(schema.itensListaCompras.id, String(itemListaComprasId)), eq(schema.itensListaCompras.obraId, obraId))),
    );
  }

  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

  await sincronizarEstoqueComCompra({
    obraId,
    produtoId: parsed.data.produtoId ?? null,
    nomeLivre: parsed.data.nomeLivre,
    quantidade,
  });

  revalidatePath("/compras");
  revalidatePath("/estoque");
  return {};
}

/**
 * Registrar uma compra incrementa o item de estoque correspondente em vez
 * de deixar a pessoa lançar a mesma coisa duas vezes (uma em Compras, outra
 * em Estoque). Casamento por produtoId do catálogo quando existe; senão por
 * nome livre (comparação sem caixa/espaços) dentro da mesma obra — nunca
 * casa com um item de outra obra. Sem correspondência, cria um item novo
 * com origem "COMPRA" (proveniência: nasceu de uma compra registrada, não
 * de digitação manual em Estoque) e unidade "un" como padrão razoável,
 * ajustável depois na tela de Estoque.
 */
export async function sincronizarEstoqueComCompra(params: {
  obraId: string;
  produtoId: string | null;
  nomeLivre: string;
  quantidade: number;
}): Promise<void> {
  const { obraId, produtoId, nomeLivre, quantidade } = params;

  let itemExistenteId: string | null = null;

  if (produtoId) {
    const [item] = await db
      .select({ id: schema.itensEstoque.id })
      .from(schema.itensEstoque)
      .where(and(eq(schema.itensEstoque.obraId, obraId), eq(schema.itensEstoque.produtoId, produtoId)))
      .limit(1);
    itemExistenteId = item?.id ?? null;
  } else {
    const nomeNormalizado = nomeLivre.trim().toLowerCase();
    const candidatos = await db
      .select({ id: schema.itensEstoque.id, nomeLivre: schema.itensEstoque.nomeLivre })
      .from(schema.itensEstoque)
      .where(and(eq(schema.itensEstoque.obraId, obraId), isNull(schema.itensEstoque.produtoId)));
    itemExistenteId = candidatos.find((c) => c.nomeLivre?.trim().toLowerCase() === nomeNormalizado)?.id ?? null;
  }

  if (itemExistenteId) {
    await db
      .update(schema.itensEstoque)
      .set({ quantidade: sql`${schema.itensEstoque.quantidade} + ${quantidade}` })
      .where(eq(schema.itensEstoque.id, itemExistenteId));
  } else {
    await db.insert(schema.itensEstoque).values({
      obraId,
      produtoId,
      nomeLivre,
      quantidade,
      unidade: "un",
      origem: "COMPRA",
    });
  }
}

export async function excluirCompra(obraId: string, compraId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db.delete(schema.compras).where(and(eq(schema.compras.id, compraId), eq(schema.compras.obraId, obraId)));
  revalidatePath("/compras");
}
