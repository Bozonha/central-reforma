"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import path from "node:path";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import type { FormState } from "../obras/actions";
import type { TipoDocumento } from "@central-reforma/domain";

const TIPOS_VALIDOS: TipoDocumento[] = ["ORCAMENTO", "CONTRATO", "NOTA", "RECIBO", "GARANTIA", "PLANTA", "OUTRO"];
const TAMANHO_MAXIMO_BYTES = 15 * 1024 * 1024; // 15MB
const MIME_PERMITIDOS = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function extensaoSegura(nomeOriginal: string): string {
  const ext = path.extname(nomeOriginal).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

/**
 * Armazenamento de arquivos: usa o Vercel Blob (`@vercel/blob`), não o
 * filesystem local. O filesystem de uma função serverless/edge na Vercel é
 * efêmero (não persiste entre requisições/deploys), então gravar em
 * `public/uploads` como antes nunca teria funcionado em produção — só
 * parecia funcionar em `next dev` local. Requer a env var
 * `BLOB_READ_WRITE_TOKEN` (criada automaticamente ao conectar um Blob store
 * ao projeto na Vercel).
 */
export async function enviarDocumento(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const tipo = String(formData.get("tipo") || "");
  if (!TIPOS_VALIDOS.includes(tipo as TipoDocumento)) {
    return { fieldErrors: { tipo: "Selecione um tipo válido." } };
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { fieldErrors: { arquivo: "Selecione um arquivo." } };
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { fieldErrors: { arquivo: "Arquivo maior que 15MB." } };
  }
  if (!MIME_PERMITIDOS.has(arquivo.type)) {
    return { fieldErrors: { arquivo: "Tipo de arquivo não suportado. Use PDF, imagem, Word ou Excel." } };
  }

  const id = crypto.randomUUID();
  const ext = extensaoSegura(arquivo.name);
  const caminhoBlob = `${obraId}/${id}${ext}`;

  let blobUrl: string;
  try {
    const blob = await put(caminhoBlob, arquivo, {
      access: "public",
      contentType: arquivo.type,
      addRandomSuffix: false,
    });
    blobUrl = blob.url;
  } catch {
    return { error: "Não consegui salvar o arquivo. Tente novamente em instantes." };
  }

  await db.insert(schema.documentos).values({
    obraId,
    tipo,
    arquivoUrl: blobUrl,
    nomeArquivo: arquivo.name,
    tamanhoBytes: arquivo.size,
    mimeType: arquivo.type,
    extraidoPor: "MANUAL",
  });

  revalidatePath("/documentos");
  return {};
}

export async function excluirDocumento(obraId: string, documentoId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const [doc] = await db
    .select()
    .from(schema.documentos)
    .where(and(eq(schema.documentos.id, documentoId), eq(schema.documentos.obraId, obraId)))
    .limit(1);

  await db.delete(schema.documentos).where(and(eq(schema.documentos.id, documentoId), eq(schema.documentos.obraId, obraId)));

  if (doc) {
    await del(doc.arquivoUrl).catch(() => {});
  }

  revalidatePath("/documentos");
}
