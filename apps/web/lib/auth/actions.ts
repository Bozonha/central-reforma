"use server";

import { db, schema } from "@central-reforma/database";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "./password";
import { createSessionCookie, destroySessionCookie, getSession } from "./session";
import { obterIpRequisicao, registrarTentativaFalha, verificarRateLimitLogin } from "./rate-limit";
import { loginSchema, registroSchema } from "../validation/auth";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Ver o comentário equivalente em lib/forms/state.ts — mesmo motivo:
   * evitar chamar redirect() dentro de uma Server Action disparada via
   * useActionState, que pode deixar a tela travada até um F5 manual. */
  redirectTo?: string;
}

export async function registrarUsuario(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registroSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    confirmaSenha: formData.get("confirmaSenha"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { nome, email, senha } = parsed.data;

  const [existente] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, email)).limit(1);
  if (existente) {
    return { error: "Já existe uma conta com este e-mail. Tente entrar em vez de cadastrar." };
  }

  const senhaHash = await hashPassword(senha);
  const [usuario] = await db
    .insert(schema.usuarios)
    .values({ nome, email, senhaHash })
    .returning();

  if (!usuario) {
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  await createSessionCookie({ usuarioId: usuario.id, email: usuario.email, nome: usuario.nome });
  return { redirectTo: "/obras/nova?primeira=1" };
}

export async function entrarComCredenciais(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { email, senha } = parsed.data;

  const ip = await obterIpRequisicao();
  const identificadores = [`email:${email}`, `ip:${ip}`];

  const { bloqueado } = await verificarRateLimitLogin(identificadores);
  if (bloqueado) {
    return { error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." };
  }

  const [usuario] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, email)).limit(1);
  if (!usuario) {
    await registrarTentativaFalha(identificadores);
    return { error: "E-mail ou senha incorretos." };
  }

  const senhaOk = await verifyPassword(senha, usuario.senhaHash);
  if (!senhaOk) {
    await registrarTentativaFalha(identificadores);
    return { error: "E-mail ou senha incorretos." };
  }

  await createSessionCookie({ usuarioId: usuario.id, email: usuario.email, nome: usuario.nome });
  return { redirectTo: "/" };
}

export async function sairDaConta(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}

/** Helper para Server Components: sessão garantida ou redireciona para /login. */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
