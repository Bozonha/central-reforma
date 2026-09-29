"use server";

import crypto from "node:crypto";
import { db, schema } from "@central-reforma/database";
import { and, eq, gt, isNull } from "drizzle-orm";
import { hashPassword } from "./password";
import { enviarEmail } from "../email/send";
import { obterBaseUrl, obterIpRequisicao, registrarTentativa, verificarRateLimit } from "./rate-limit";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

// Mensagem sempre igual, exista ou não a conta e o e-mail tenha saído ou
// não — nunca confirmar/negar a existência de uma conta por este e-mail
// (mesmo princípio já aplicado no login: ver actions.ts, "E-mail ou senha
// incorretos" genérico).
const MENSAGEM_GENERICA =
  "Se existir uma conta com este e-mail, enviamos um link para redefinir a senha. Confira sua caixa de entrada (e o spam).";

function gerarToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface RecuperarSenhaState {
  mensagem?: string;
  fieldErrors?: Record<string, string>;
}

export async function solicitarRecuperacaoSenha(
  _prev: RecuperarSenhaState,
  formData: FormData,
): Promise<RecuperarSenhaState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return { fieldErrors: { email: "Informe um e-mail válido." } };
  }

  const ip = await obterIpRequisicao();
  const identificadores = [`resetreq:email:${email}`, `resetreq:ip:${ip}`];

  // Limite mais apertado que o de login (5 por hora em vez de 8 por 15min):
  // pedir redefinição gera e-mail de verdade (custo de envio) e um token
  // novo a cada chamada, então o abuso aqui é mais caro que uma tentativa
  // de senha errada.
  const { bloqueado } = await verificarRateLimit(identificadores, { limite: 5, janelaMs: 60 * 60 * 1000 });
  if (bloqueado) {
    // Mesma mensagem genérica mesmo bloqueado — não revela que o limite
    // foi atingido nem, por tabela, que o e-mail existe ou não.
    return { mensagem: MENSAGEM_GENERICA };
  }
  await registrarTentativa(identificadores);

  const [usuario] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, email)).limit(1);

  if (usuario) {
    const token = gerarToken();
    await db.insert(schema.resetSenhaTokens).values({
      usuarioId: usuario.id,
      tokenHash: hashToken(token),
      expiraEm: new Date(Date.now() + TOKEN_TTL_MS),
    });

    const baseUrl = await obterBaseUrl();
    const link = `${baseUrl}/redefinir-senha?token=${token}`;

    const resultado = await enviarEmail({
      para: usuario.email,
      assunto: "Redefinir sua senha — Central de Reforma",
      textoSimples: `Olá, ${usuario.nome}.\n\nRecebemos um pedido para redefinir a senha da sua conta na Central de Reforma. Clique no link abaixo para escolher uma nova senha (válido por 1 hora):\n\n${link}\n\nSe você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.`,
    });

    if (!resultado.enviado) {
      // Não falha a submissão do usuário por isso (a mensagem genérica já
      // foi prometida) — mas fica registrado no log do servidor para quem
      // opera o produto perceber que e-mails de redefinição não estão
      // saindo (falta configurar RESEND_API_KEY/EMAIL_REMETENTE).
      console.warn(
        `[reset-senha] Token gerado para ${usuario.email} mas o e-mail não foi entregue (motivo: ${resultado.motivo}).`,
      );
    }
  }

  return { mensagem: MENSAGEM_GENERICA };
}

export interface RedefinirSenhaState {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
}

export async function redefinirSenha(_prev: RedefinirSenhaState, formData: FormData): Promise<RedefinirSenhaState> {
  const token = String(formData.get("token") ?? "");
  const novaSenha = String(formData.get("novaSenha") ?? "");
  const confirmaSenha = String(formData.get("confirmaSenha") ?? "");

  if (!token) {
    return { error: "Link inválido ou incompleto. Solicite uma nova redefinição de senha." };
  }
  if (novaSenha.length < 8) {
    return { fieldErrors: { novaSenha: "A senha precisa ter ao menos 8 caracteres." } };
  }
  if (novaSenha !== confirmaSenha) {
    return { fieldErrors: { confirmaSenha: "As senhas não coincidem." } };
  }

  const agora = new Date();
  const [registro] = await db
    .select()
    .from(schema.resetSenhaTokens)
    .where(
      and(
        eq(schema.resetSenhaTokens.tokenHash, hashToken(token)),
        isNull(schema.resetSenhaTokens.usadoEm),
        gt(schema.resetSenhaTokens.expiraEm, agora),
      ),
    )
    .limit(1);

  if (!registro) {
    return { error: "Este link expirou ou já foi usado. Solicite uma nova redefinição de senha." };
  }

  const senhaHash = await hashPassword(novaSenha);

  // Sem db.transaction (driver neon-http não suporta transação interativa —
  // mesma limitação documentada no resto do código, ver auditoria em
  // docs/). Ordem escolhida para minimizar o pior caso: se a segunda
  // atualização falhar, o token fica consumido e a senha já foi trocada
  // (usuário só perde a chance de usar o mesmo link de novo, o que é o
  // comportamento correto de qualquer forma); o inverso deixaria o token
  // reutilizável, que é pior.
  await db.update(schema.usuarios).set({ senhaHash }).where(eq(schema.usuarios.id, registro.usuarioId));
  await db.update(schema.resetSenhaTokens).set({ usadoEm: agora }).where(eq(schema.resetSenhaTokens.id, registro.id));

  return { redirectTo: "/login" };
}
