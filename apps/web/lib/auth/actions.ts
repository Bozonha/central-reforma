"use server";

import { db, schema } from "@central-reforma/database";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "./password";
import { createSessionCookie, destroySessionCookie, getSession } from "./session";
import { loginSchema, registroSchema } from "../validation/auth";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function registrarUsuario(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registroSchema.safeParse({
    nome: formData.get("nome"),
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
  redirect("/obras/nova?primeira=1");
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

  const [usuario] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, email)).limit(1);
  if (!usuario) {
    return { error: "E-mail ou senha incorretos." };
  }

  const senhaOk = await verifyPassword(senha, usuario.senhaHash);
  if (!senhaOk) {
    return { error: "E-mail ou senha incorretos." };
  }

  await createSessionCookie({ usuarioId: usuario.id, email: usuario.email, nome: usuario.nome });
  redirect("/");
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
