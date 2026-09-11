/**
 * Sessão via cookie httpOnly assinado (JWT, biblioteca `jose`) — implementa
 * a decisão B.2 (Auth.js self-hosted: sem serviço terceiro pago, sem
 * vendor lock) sem depender do pacote `next-auth` em si. `next-auth` não
 * foi usado nesta etapa porque este projeto roda em Next.js 16 + React 19,
 * versões recentes o suficiente para que a compatibilidade não pudesse ser
 * verificada com segurança neste ambiente (CLAUDE.md já avisa: não assumir
 * que algo bate com o treinamento sem checar a versão instalada) — a
 * alternativa foi uma sessão mínima e auditável com uma dependência já
 * madura (`jose`). Trocar por `next-auth` depois é possível sem migrar
 * dado nenhum: a tabela `usuarios` e o hash de senha continuam os mesmos.
 */
import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken, type SessionPayload } from "./jwt";

const COOKIE_NAME = "cr_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export async function createSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { COOKIE_NAME as SESSION_COOKIE_NAME };
export type { SessionPayload };
