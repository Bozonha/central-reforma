"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { reaisToCents } from "@central-reforma/domain";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { produtoSchema, lojaManualSchema, ofertaSchema } from "../validation/mercado";
import type { FormState } from "../obras/actions";
import { geocodificarEndereco } from "./nominatim";

function parseNumberInput(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(",", "."));
  return Number.isNaN(n) ? undefined : n;
}

// ---------------------------------------------------------------------------
// Catálogo — produtos, lojas, ofertas. Compartilhado entre obras/usuários
// (não tem obraId): é a base universal de mercado combinada com cadastro
// manual real (decisão de escopo: "cadastro manual real + integração pronta
// para plugar" — Mercado Livre entra depois, sem mudar este catálogo).
// ---------------------------------------------------------------------------

export async function criarProduto(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();

  const parsed = produtoSchema.safeParse({
    nome: formData.get("nome"),
    categoria: formData.get("categoria") || undefined,
    marca: formData.get("marca") || undefined,
    modelo: formData.get("modelo") || undefined,
    unidade: formData.get("unidade"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  await db.insert(schema.produtos).values(parsed.data);
  revalidatePath("/compras");
  return {};
}

export async function criarLojaManual(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();

  const parsed = lojaManualSchema.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    logradouro: formData.get("logradouro") || undefined,
    cidade: formData.get("cidade") || undefined,
    estado: formData.get("estado") || undefined,
    cep: formData.get("cep") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  let latitude: number | null = null;
  let longitude: number | null = null;
  if (parsed.data.tipo === "FISICA") {
    const enderecoCompleto = [parsed.data.logradouro, parsed.data.cidade, parsed.data.estado].filter(Boolean).join(", ");
    if (enderecoCompleto) {
      const geo = await geocodificarEndereco(enderecoCompleto);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
      }
    }
  }

  await db.insert(schema.lojas).values({
    nome: parsed.data.nome,
    tipo: parsed.data.tipo,
    logradouro: parsed.data.logradouro ?? null,
    cidade: parsed.data.cidade ?? null,
    estado: parsed.data.estado ?? null,
    cep: parsed.data.cep ?? null,
    latitude,
    longitude,
    fonte: "MANUAL",
  });

  revalidatePath("/compras");
  return {};
}

export async function criarOferta(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();

  const parsed = ofertaSchema.safeParse({
    produtoId: formData.get("produtoId"),
    lojaId: formData.get("lojaId"),
    preco: formData.get("preco"),
    unidade: formData.get("unidade"),
    frete: formData.get("frete") || undefined,
    fonteUrl: formData.get("fonteUrl") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const precoCent = reaisToCents(parseNumberInput(parsed.data.preco) ?? 0);
  if (precoCent <= 0) return { fieldErrors: { preco: "Informe um preço válido." } };
  const freteCent = parsed.data.frete ? reaisToCents(parseNumberInput(parsed.data.frete) ?? 0) : null;

  await db.insert(schema.ofertas).values({
    produtoId: parsed.data.produtoId,
    lojaId: parsed.data.lojaId,
    precoCent,
    unidade: parsed.data.unidade,
    freteCent,
    fonte: "MANUAL",
    fonteUrl: parsed.data.fonteUrl ?? null,
    confianca: "CONFIRMADO",
  });

  // Histórico de preço é append-only (nunca atualizado) — toda oferta manual
  // vira também uma observação de preço, para alimentar a classificação
  // verde/amarelo/vermelho/cinza (packages/domain/src/price-history.ts).
  await db.insert(schema.priceObservations).values({
    produtoId: parsed.data.produtoId,
    lojaId: parsed.data.lojaId,
    precoCent,
    fonte: "MANUAL",
    fonteUrl: parsed.data.fonteUrl ?? null,
  });

  revalidatePath("/compras");
  return {};
}

// ---------------------------------------------------------------------------
// Lojas próximas via OpenStreetMap (mapa) — descoberta real, com
// proveniência (fonte="OSM", fonteId = id do node/way no OSM). Salvar no
// catálogo é uma ação explícita do usuário, não automática.
// ---------------------------------------------------------------------------

export async function salvarLojaDescoberta(formData: FormData): Promise<void> {
  await requireSession();

  const osmId = String(formData.get("osmId") || "");
  const nome = String(formData.get("nome") || "");
  const categoria = String(formData.get("categoria") || "") || null;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const endereco = String(formData.get("endereco") || "") || null;

  if (!osmId || !nome || Number.isNaN(latitude) || Number.isNaN(longitude)) return;

  const [jaExiste] = await db.select().from(schema.lojas).where(eq(schema.lojas.fonteId, osmId)).limit(1);
  if (jaExiste) return;

  await db.insert(schema.lojas).values({
    nome,
    tipo: "FISICA",
    logradouro: endereco,
    latitude,
    longitude,
    fonte: "OSM",
    fonteId: osmId,
  });

  revalidatePath("/compras");
}

/**
 * Geocodifica o endereço cadastrado da obra (Nominatim) e salva
 * lat/long — usado para centralizar o mapa de lojas próximas. Se o
 * endereço não tiver dados suficientes ou a geocodificação falhar, não
 * altera nada (nunca inventa coordenada).
 */
export async function geocodificarObra(obraId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const [obra] = await db.select().from(schema.obras).where(eq(schema.obras.id, obraId)).limit(1);
  if (!obra) return { error: "Obra não encontrada." };

  const endereco = [obra.logradouro, obra.cidade, obra.estado, obra.cep].filter(Boolean).join(", ");
  if (!endereco) {
    return { error: "Cadastre o endereço da obra primeiro (em Obras → editar)." };
  }

  const geo = await geocodificarEndereco(endereco);
  if (!geo) {
    return { error: "Não foi possível localizar este endereço agora. Tente novamente mais tarde." };
  }

  await db
    .update(schema.obras)
    .set({ latitude: geo.latitude, longitude: geo.longitude, geocodificadoEm: new Date() })
    .where(and(eq(schema.obras.id, obraId)));

  revalidatePath("/compras");
  return {};
}
