"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq, ilike, inArray } from "drizzle-orm";
import { getSession } from "../auth/session";
import { obraIdsDoUsuario } from "../auth/obra-access";

export interface ResultadoBusca {
  tipo: "obra" | "ambiente" | "documento";
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
}

const LIMITE_POR_TIPO = 5;

/**
 * Busca da paleta de comandos (Cmd/Ctrl+K). Escopo sempre restrito às obras
 * das quais o usuário é ObraColaborador (CLAUDE.md #6 e #7 — nunca "o banco
 * inteiro"): resolve as obras acessíveis primeiro e filtra tudo por
 * `inArray(obraId, ids)`, nunca por busca livre sem esse filtro.
 */
export async function buscarComando(queryBruta: string): Promise<ResultadoBusca[]> {
  const query = queryBruta.trim();
  if (query.length < 2) return [];

  const sessao = await getSession();
  if (!sessao) return [];

  const ids = await obraIdsDoUsuario(sessao.usuarioId);
  if (ids.length === 0) return [];

  const termo = `%${query}%`;

  const [obrasEncontradas, ambientesEncontrados, documentosEncontrados] = await Promise.all([
    db
      .select({ id: schema.obras.id, nome: schema.obras.nome, cidade: schema.obras.cidade })
      .from(schema.obras)
      .where(and(inArray(schema.obras.id, ids), ilike(schema.obras.nome, termo)))
      .limit(LIMITE_POR_TIPO),
    db
      .select({
        id: schema.ambientes.id,
        nome: schema.ambientes.nome,
        obraId: schema.ambientes.obraId,
        obraNome: schema.obras.nome,
      })
      .from(schema.ambientes)
      .innerJoin(schema.obras, eq(schema.obras.id, schema.ambientes.obraId))
      .where(and(inArray(schema.ambientes.obraId, ids), ilike(schema.ambientes.nome, termo)))
      .limit(LIMITE_POR_TIPO),
    db
      .select({
        id: schema.documentos.id,
        nomeArquivo: schema.documentos.nomeArquivo,
        obraId: schema.documentos.obraId,
        obraNome: schema.obras.nome,
      })
      .from(schema.documentos)
      .innerJoin(schema.obras, eq(schema.obras.id, schema.documentos.obraId))
      .where(and(inArray(schema.documentos.obraId, ids), ilike(schema.documentos.nomeArquivo, termo)))
      .limit(LIMITE_POR_TIPO),
  ]);

  const resultados: ResultadoBusca[] = [
    ...obrasEncontradas.map((o) => ({
      tipo: "obra" as const,
      id: o.id,
      titulo: o.nome,
      subtitulo: o.cidade ?? "Obra",
      href: `/obras/${o.id}`,
    })),
    ...ambientesEncontrados.map((a) => ({
      tipo: "ambiente" as const,
      id: a.id,
      titulo: a.nome,
      subtitulo: `Ambiente · ${a.obraNome}`,
      href: `/obras/${a.obraId}`,
    })),
    ...documentosEncontrados.map((d) => ({
      tipo: "documento" as const,
      id: d.id,
      titulo: d.nomeArquivo,
      subtitulo: `Documento · ${d.obraNome}`,
      href: `/documentos?obraId=${d.obraId}`,
    })),
  ];

  return resultados;
}
