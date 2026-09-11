/**
 * Isolamento entre usuários (CLAUDE.md #6): ninguém acessa uma Obra da qual
 * não é `ObraColaborador` — nem por bug de aplicação. Esta é a ÚNICA porta
 * de entrada permitida para checar acesso a uma Obra; nenhuma query de
 * obra/ambiente/compra/etc. em nenhuma server action deve pular esta função.
 *
 * Nota sobre defesa em profundidade: o desenho original previa checagem na
 * aplicação *e* Row-Level Security no Postgres como segunda camada. Como o
 * banco atual é SQLite (decisão temporária, ver packages/database/src/schema.ts),
 * só existe a camada de aplicação por enquanto — motivo a mais para nunca
 * pular esta função. RLS volta a existir quando o Postgres for adotado
 * (policies já esboçadas em packages/database/prisma/rls-notes.sql).
 */
import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import type { PapelColaborador } from "@central-reforma/domain";

export class AcessoNegadoError extends Error {
  constructor(message = "Você não tem acesso a esta obra.") {
    super(message);
    this.name = "AcessoNegadoError";
  }
}

const NIVEL_PAPEL: Record<PapelColaborador, number> = {
  VISUALIZADOR: 0,
  COLABORADOR: 1,
  DONO: 2,
};

/**
 * Garante que `usuarioId` é colaborador de `obraId` com papel >= `papelMinimo`.
 * Lança AcessoNegadoError caso contrário — chamador nunca deve tentar
 * "recuperar" desse erro além de devolver 403/redirecionar.
 */
export async function requireObraAccess(
  usuarioId: string,
  obraId: string,
  papelMinimo: PapelColaborador = "VISUALIZADOR",
) {
  const [colaboracao] = await db
    .select()
    .from(schema.obraColaboradores)
    .where(
      and(
        eq(schema.obraColaboradores.obraId, obraId),
        eq(schema.obraColaboradores.usuarioId, usuarioId),
      ),
    )
    .limit(1);

  if (!colaboracao) {
    throw new AcessoNegadoError();
  }

  const papel = colaboracao.papel as PapelColaborador;
  if (NIVEL_PAPEL[papel] < NIVEL_PAPEL[papelMinimo]) {
    throw new AcessoNegadoError(
      `É preciso ser ao menos "${papelMinimo}" nesta obra para fazer isso.`,
    );
  }

  return colaboracao;
}

/** Lista os IDs de obra que o usuário pode ver — base de toda listagem. */
export async function obraIdsDoUsuario(usuarioId: string): Promise<string[]> {
  const linhas = await db
    .select({ obraId: schema.obraColaboradores.obraId })
    .from(schema.obraColaboradores)
    .where(eq(schema.obraColaboradores.usuarioId, usuarioId));
  return linhas.map((l) => l.obraId);
}
