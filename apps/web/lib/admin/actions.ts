"use server";

import { db, schema } from "@central-reforma/database";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { podeCriarContaComPapel, type PapelConta } from "@central-reforma/domain";
import { hashPassword } from "../auth/password";
import { getSession } from "../auth/session";
import { AcessoAdminNegadoError, alterarPapelUsuario, papelContaAtual, registrarAuditoria } from "../auth/rbac";
import type { FormState } from "../forms/state";
import { valoresDoFormulario } from "../forms/state";

const criarUsuarioSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome completo.").max(120),
    email: z.string().trim().toLowerCase().email("E-mail inválido."),
    senha: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
    confirmaSenha: z.string().min(1, "Confirme a senha."),
    papel: z.enum(["ADMIN", "USUARIO"]),
  })
  .refine((data) => data.senha === data.confirmaSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmaSenha"],
  });

/**
 * Cria uma nova conta a partir do painel administrativo. SUPERADMIN pode
 * escolher ADMIN ou USUARIO; ADMIN só pode criar USUARIO — a checagem final
 * é sempre `podeCriarContaComPapel`, nunca confia no valor enviado pelo
 * formulário sem essa validação de servidor.
 */
export async function criarUsuarioAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await getSession();
  if (!sessao) return { error: "Sessão expirada. Entre novamente." };

  const parsed = criarUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    confirmaSenha: formData.get("confirmaSenha"),
    papel: formData.get("papel"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const atorPapel = await papelContaAtual(sessao.usuarioId);
  if (!podeCriarContaComPapel(atorPapel, parsed.data.papel)) {
    throw new AcessoAdminNegadoError();
  }

  const { nome, email, senha, papel } = parsed.data;

  const [existente] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, email)).limit(1);
  if (existente) {
    return { error: "Já existe uma conta com este e-mail.", values: valoresDoFormulario(formData) };
  }

  const senhaHash = await hashPassword(senha);
  const [novoUsuario] = await db.insert(schema.usuarios).values({ nome, email, senhaHash, papel }).returning();
  if (!novoUsuario) {
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  await registrarAuditoria({
    atorUsuarioId: sessao.usuarioId,
    acao: "USUARIO_CRIADO",
    alvoUsuarioId: novoUsuario.id,
    detalhe: `${nome} <${email}> criado com papel ${papel}`,
  });

  return {};
}

/** Altera o papel de uma conta existente — só SUPERADMIN, ver lib/auth/rbac.ts. */
export async function alterarPapelAction(usuarioId: string, formData: FormData): Promise<void> {
  const sessao = await getSession();
  if (!sessao) throw new AcessoAdminNegadoError();

  const novoPapel = formData.get("papel");
  if (novoPapel !== "SUPERADMIN" && novoPapel !== "ADMIN" && novoPapel !== "USUARIO") return;

  await alterarPapelUsuario(sessao.usuarioId, usuarioId, novoPapel as PapelConta);
}
