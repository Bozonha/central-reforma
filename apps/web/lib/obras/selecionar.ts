import { db, schema } from "@central-reforma/database";
import { inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { obraIdsDoUsuario, requireObraAccess, AcessoNegadoError } from "../auth/obra-access";
import { OBRA_COOKIE_NAME } from "./obra-cookie";

export interface ObraSelecionada {
  obras: { id: string; nome: string }[];
  obraId: string | null;
}

/**
 * Resolve qual obra está selecionada nas abas cross-obra (Orçamento, Compras,
 * Estoque, Cronograma, Documentos, Diário): usa `?obraId=` se válido e
 * acessível; senão usa o cookie `cr_obra_ativa` (última obra selecionada —
 * ver lib/obras/obra-cookie.ts) se também válido; senão cai na primeira
 * obra do usuário. Nunca devolve uma obra que o usuário não pode acessar —
 * chama requireObraAccess por baixo. Lê o cookie direto (em vez de recebê-lo
 * por parâmetro) para que toda página cross-obra ganhe o comportamento só
 * chamando esta função, sem precisar tocar em `cookies()` ela mesma.
 */
export async function resolverObraSelecionada(
  usuarioId: string,
  obraIdParam: string | undefined,
): Promise<ObraSelecionada> {
  const ids = await obraIdsDoUsuario(usuarioId);
  const primeiraId = ids[0];
  if (!primeiraId) return { obras: [], obraId: null };

  const obraIdCookie = (await cookies()).get(OBRA_COOKIE_NAME)?.value;

  const obras = await db
    .select({ id: schema.obras.id, nome: schema.obras.nome })
    .from(schema.obras)
    .where(inArray(schema.obras.id, ids));

  let obraId =
    (obraIdParam && ids.includes(obraIdParam) ? obraIdParam : undefined) ??
    (obraIdCookie && ids.includes(obraIdCookie) ? obraIdCookie : undefined) ??
    primeiraId;

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
