import { db, schema } from "@central-reforma/database";
import { inArray, eq } from "drizzle-orm";
import { obraIdsDoUsuario, requireObraAccess, AcessoNegadoError } from "../auth/obra-access";

export interface ObraSelecionada {
  obras: { id: string; nome: string }[];
  obraId: string | null;
}

/**
 * Resolve qual obra está selecionada nas abas cross-obra (Orçamento, Compras,
 * Estoque, Cronograma, Documentos, Diário): usa `?obraId=` se válido e
 * acessível, senão cai na primeira obra do usuário. Nunca devolve uma obra
 * que o usuário não pode acessar — chama requireObraAccess por baixo.
 */
export async function resolverObraSelecionada(
  usuarioId: string,
  obraIdParam: string | undefined,
): Promise<ObraSelecionada> {
  const ids = await obraIdsDoUsuario(usuarioId);
  const primeiraId = ids[0];
  if (!primeiraId) return { obras: [], obraId: null };

  const obras = await db
    .select({ id: schema.obras.id, nome: schema.obras.nome })
    .from(schema.obras)
    .where(inArray(schema.obras.id, ids));

  let obraId = obraIdParam && ids.includes(obraIdParam) ? obraIdParam : primeiraId;

  try {
    await requireObraAccess(usuarioId, obraId, "VISUALIZADOR");
  } catch (err) {
    if (err instanceof AcessoNegadoError) {
      obraId = primeiraId;
    } else {
      throw err;
    }
  }

  return { obras, obraId };
}
