import { db, schema } from "@central-reforma/database";
import { eq } from "drizzle-orm";
import { requireSession } from "../../../../../lib/auth/actions";
import { AcessoNegadoError, requireObraAccess } from "../../../../../lib/auth/obra-access";

/**
 * Download autenticado de documento (CLAUDE.md #6 — isolamento entre
 * usuários). O Vercel Blob só oferece `access: "public"` no `put()` — a URL
 * do blob em si não tem controle de acesso nem expiração. Por isso a URL
 * pública nunca é exposta na UI (ver documentos/page.tsx): o link visível
 * aponta para esta rota, que confere sessão + `requireObraAccess` antes de
 * buscar o arquivo no Blob e servir o conteúdo — a URL pública continua
 * existindo (limite da própria Vercel Blob hoje), mas deixa de ser
 * descoberta ou divulgada pelo app.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await requireSession();

  const [documento] = await db.select().from(schema.documentos).where(eq(schema.documentos.id, id)).limit(1);
  if (!documento) {
    return new Response("Documento não encontrado.", { status: 404 });
  }

  try {
    await requireObraAccess(sessao.usuarioId, documento.obraId, "VISUALIZADOR");
  } catch (err) {
    if (err instanceof AcessoNegadoError) {
      return new Response("Documento não encontrado.", { status: 404 });
    }
    throw err;
  }

  let respostaBlob: Response;
  try {
    respostaBlob = await fetch(documento.arquivoUrl);
  } catch {
    return new Response("Não foi possível carregar o arquivo.", { status: 502 });
  }
  if (!respostaBlob.ok || !respostaBlob.body) {
    return new Response("Não foi possível carregar o arquivo.", { status: 502 });
  }

  const nomeSeguro = documento.nomeArquivo.replace(/[\r\n"]/g, "");

  return new Response(respostaBlob.body, {
    status: 200,
    headers: {
      "Content-Type": documento.mimeType,
      "Content-Disposition": `inline; filename="${nomeSeguro}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
