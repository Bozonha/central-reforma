/**
 * Assinatura/verificação do token de sessão — sem `next/headers`, para que
 * o middleware (Edge runtime) possa importar isto sem puxar APIs de Node.
 * `session.ts` (que lida com o cookie em si, em Server Components/Actions)
 * importa este arquivo.
 */
import { SignJWT, jwtVerify } from "jose";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET nao definida. Configure a variavel de ambiente (ver .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  usuarioId: string;
  email: string;
  nome: string;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.usuarioId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.nome !== "string"
    ) {
      return null;
    }
    return { usuarioId: payload.usuarioId, email: payload.email, nome: payload.nome };
  } catch {
    // Token inválido, expirado ou assinado com outra chave — sessão
    // inexistente, nunca "quase válida".
    return null;
  }
}

export const SESSION_DURATION_SECONDS_EXPORT = SESSION_DURATION_SECONDS;
