"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import path from "node:path";
import { reaisToCents } from "@central-reforma/domain";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { sincronizarEstoqueComCompra } from "../compras/actions";
import { analisarComCascata, TodosProvedoresFalharamError, type TentativaCascata } from "./cascata";
import { PROMPT_RECIBO, promptReciboUsuario, PROMPT_GENERICO, PROMPT_GENERICO_USUARIO } from "./prompts";
import {
  CATEGORIAS_CARREGAMENTO,
  tipoDocumentoDaCategoria,
  type CategoriaCarregamento,
  type EstadoCarregamento,
  type ItemReciboRascunho,
  type ItemReciboConfirmado,
} from "./carregamento-tipos";

const TAMANHO_MAXIMO_BYTES = 15 * 1024 * 1024;
const MIME_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function extensaoSegura(nomeOriginal: string): string {
  const ext = path.extname(nomeOriginal).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

function extrairJson<T>(texto: string): T | null {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim < inicio) return null;
  try {
    return JSON.parse(texto.slice(inicio, fim + 1)) as T;
  } catch {
    return null;
  }
}

function mensagemFalhaTotal(tentativas: TentativaCascata[]): string {
  const nenhumaChaveConfigurada = tentativas.length === 0;
  if (nenhumaChaveConfigurada) {
    return "Nenhum provedor de IA está configurado no servidor. Configure ao menos GEMINI_API_KEY nas variáveis de ambiente do projeto na Vercel.";
  }
  const cotaEmTodos = tentativas.every((t) => t.erro === "COTA_EXCEDIDA");
  if (cotaEmTodos) {
    return "A cota gratuita de todos os provedores de IA configurados foi atingida por agora. Tente novamente em alguns minutos.";
  }
  const resumo = tentativas.map((t) => `${t.provedor} (${t.erro})`).join(", ");
  return `Não foi possível analisar a foto — todos os provedores de IA disponíveis falharam: ${resumo}. Tente novamente em alguns minutos.`;
}

/**
 * Passo 1 da aba "Carregar": recebe a foto + categoria + descrição breve,
 * salva o arquivo no Blob (mesmo padrão de lib/documentos/actions.ts),
 * cria o registro em `documentos` para manter proveniência, e chama a IA
 * para gerar um RASCUNHO — nunca grava em Compras/Estoque/Orçamento aqui.
 * Só a categoria "RECIBO" extrai itens estruturados; as demais reaproveitam
 * o resumo genérico (mesmo comportamento de "Analisar com IA" em Documentos).
 */
export async function prepararCarregamento(_prev: EstadoCarregamento, formData: FormData): Promise<EstadoCarregamento> {
  const sessao = await requireSession();
  const obraId = String(formData.get("obraId") || "");
  if (!obraId) return { fieldErrors: { obraId: "Selecione uma obra." } };
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const categoria = String(formData.get("categoria") || "") as CategoriaCarregamento;
  if (!CATEGORIAS_CARREGAMENTO.some((c) => c.value === categoria)) {
    return { fieldErrors: { categoria: "Selecione uma categoria válida." } };
  }

  const descricao = String(formData.get("descricao") || "").trim() || null;

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { fieldErrors: { arquivo: "Escolha uma foto ou arquivo." } };
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { fieldErrors: { arquivo: "Arquivo maior que 15MB." } };
  }
  if (!MIME_PERMITIDOS.has(arquivo.type)) {
    return { fieldErrors: { arquivo: "Use uma foto (JPG/PNG/WEBP) ou PDF." } };
  }

  const bytes = Buffer.from(await arquivo.arrayBuffer());
  const base64 = bytes.toString("base64");

  const id = crypto.randomUUID();
  const ext = extensaoSegura(arquivo.name);
  const caminhoBlob = `${obraId}/carregamento/${id}${ext}`;

  let blobUrl: string;
  try {
    const blob = await put(caminhoBlob, arquivo, { access: "public", contentType: arquivo.type, addRandomSuffix: false });
    blobUrl = blob.url;
  } catch {
    return { error: "Não consegui salvar o arquivo. Tente novamente em instantes." };
  }

  const [documento] = await db
    .insert(schema.documentos)
    .values({
      obraId,
      tipo: tipoDocumentoDaCategoria(categoria),
      arquivoUrl: blobUrl,
      nomeArquivo: arquivo.name,
      tamanhoBytes: arquivo.size,
      mimeType: arquivo.type,
      classificacao: descricao,
      extraidoPor: "MANUAL",
    })
    .returning({ id: schema.documentos.id });

  if (!documento) return { error: "Não consegui registrar o documento. Tente novamente." };

  let cascataResultado;
  try {
    if (categoria === "RECIBO") {
      cascataResultado = await analisarComCascata({ base64, mimeType: arquivo.type }, PROMPT_RECIBO, promptReciboUsuario(descricao));
    } else {
      const prompt = descricao
        ? `${PROMPT_GENERICO_USUARIO}\n\nContexto fornecido pela pessoa: "${descricao}"`
        : PROMPT_GENERICO_USUARIO;
      cascataResultado = await analisarComCascata({ base64, mimeType: arquivo.type }, PROMPT_GENERICO, prompt);
    }
  } catch (erro) {
    if (erro instanceof TodosProvedoresFalharamError) {
      return { error: mensagemFalhaTotal(erro.tentativas) };
    }
    return { error: `Erro inesperado ao chamar a IA: ${erro instanceof Error ? erro.message : "desconhecido"}.` };
  }

  revalidatePath("/documentos");

  if (categoria === "RECIBO") {
    type SaidaRecibo = { loja?: string | null; data?: string | null; observacoes?: string | null; itens?: ItemReciboRascunho[] };
    const parsed = extrairJson<SaidaRecibo>(cascataResultado.texto);
    if (!parsed || !Array.isArray(parsed.itens)) {
      return { error: "A IA não retornou um resultado no formato esperado. Tente novamente." };
    }
    const itens = parsed.itens.filter((i) => i && typeof i.nomeLivre === "string" && i.nomeLivre.trim().length > 0);

    await db
      .update(schema.documentos)
      .set({ extraidoPor: `IA:${cascataResultado.provedor}` })
      .where(eq(schema.documentos.id, documento.id));

    return {
      status: "RASCUNHO_RECIBO",
      documentoId: documento.id,
      loja: parsed.loja ?? null,
      data: parsed.data ?? null,
      observacoes: parsed.observacoes ?? null,
      itens,
      provedor: cascataResultado.provedor,
    };
  }

  type SaidaGenerica = { tipoIdentificado?: string | null; resumo?: string; pontosChave?: string[]; valores?: string[]; alertas?: string[] };
  const parsed = extrairJson<SaidaGenerica>(cascataResultado.texto);
  if (!parsed || typeof parsed.resumo !== "string") {
    return { error: "A IA não retornou um resultado no formato esperado. Tente novamente." };
  }

  const classificacao = [parsed.tipoIdentificado ?? "Documento", `— ${parsed.resumo}`].join(" ");
  await db
    .update(schema.documentos)
    .set({ classificacao, extraidoPor: `IA:${cascataResultado.provedor}` })
    .where(eq(schema.documentos.id, documento.id));

  return {
    status: "RESUMO_GENERICO",
    documentoId: documento.id,
    tipoIdentificado: parsed.tipoIdentificado ?? null,
    resumo: parsed.resumo,
    pontosChave: Array.isArray(parsed.pontosChave) ? parsed.pontosChave.filter((s) => typeof s === "string") : [],
    valores: Array.isArray(parsed.valores) ? parsed.valores.filter((s) => typeof s === "string") : [],
    alertas: Array.isArray(parsed.alertas) ? parsed.alertas.filter((s) => typeof s === "string") : [],
    provedor: cascataResultado.provedor,
  };
}

/**
 * Passo 2, só para RECIBO: grava os itens que a pessoa revisou e confirmou
 * (já editados/corrigidos na tela, não o rascunho bruto da IA) como
 * registros reais de Compra — reaproveita a mesma sincronização de estoque
 * usada pelo registro manual de compras (lib/compras/actions.ts), para que
 * as duas portas de entrada tenham exatamente o mesmo comportamento.
 */
export async function confirmarCarregamentoRecibo(
  obraId: string,
  documentoId: string,
  itens: ItemReciboConfirmado[],
): Promise<{ error?: string; salvos?: number }> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const [doc] = await db
    .select({ id: schema.documentos.id })
    .from(schema.documentos)
    .where(and(eq(schema.documentos.id, documentoId), eq(schema.documentos.obraId, obraId)))
    .limit(1);
  if (!doc) return { error: "Documento não encontrado." };

  const validos = itens.filter((i) => i.nomeLivre.trim().length > 0 && i.quantidade > 0 && i.precoUnitario >= 0);
  if (validos.length === 0) return { error: "Nenhum item válido para salvar." };

  const data = new Date();
  const queries: BatchItem<"pg">[] = validos.map((item) => {
    const precoUnitarioCent = reaisToCents(item.precoUnitario);
    return db.insert(schema.compras).values({
      obraId,
      nomeLivre: item.nomeLivre.trim(),
      quantidade: item.quantidade,
      precoUnitarioCent,
      valorTotalCent: Math.round(precoUnitarioCent * item.quantidade),
      data,
    });
  });
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

  for (const item of validos) {
    await sincronizarEstoqueComCompra({ obraId, produtoId: null, nomeLivre: item.nomeLivre.trim(), quantidade: item.quantidade });
  }

  await db.update(schema.documentos).set({ extraidoPor: `IA:confirmado-por-usuario` }).where(eq(schema.documentos.id, documentoId));

  revalidatePath("/compras");
  revalidatePath("/estoque");
  revalidatePath("/documentos");

  return { salvos: validos.length };
}
