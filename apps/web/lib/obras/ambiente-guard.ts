import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";

/**
 * Valida que `ambienteId` (opcional, vindo de um form) realmente pertence a
 * `obraId` antes de gravar — nunca confia num id enviado pelo cliente sem
 * checar (CLAUDE.md #6/#7: contexto escopado, isolamento absoluto). Usado
 * por Orçamento e Estoque ao vincular uma linha/item a um Ambiente.
 * Retorna o id validado ou `null` (sem ambiente vinculado / id inválido).
 */
export async function ambientePertenceAObra(ambienteId: string | undefined, obraId: string): Promise<string | null> {
  if (!ambienteId) return null;
  const [ambiente] = await db
    .select({ id: schema.ambientes.id })
    .from(schema.ambientes)
    .where(and(eq(schema.ambientes.id, ambienteId), eq(schema.ambientes.obraId, obraId)))
    .limit(1);
  return ambiente?.id ?? null;
}
