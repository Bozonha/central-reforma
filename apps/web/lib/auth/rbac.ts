/**
 * Camada de aplicação do RBAC de conta — a única porta de entrada permitida
 * para checar/alterar `usuarios.papel` (mesma convenção de
 * lib/auth/obra-access.ts para ObraColaborador). As regras em si são puras
 * e vivem em packages/domain/src/rbac.ts; este arquivo só busca o papel
 * atual no banco (sempre fresco — nunca confiar num `papel` guardado no JWT
 * de sessão, que pode durar até 30 dias e ficaria desatualizado se alguém
 * for rebaixado) e grava o log de auditoria.
 */
import { db, schema } from "@central-reforma/database";
import { count, eq } from "drizzle-orm";
import {
  alteracaoDeixariaSemSuperAdmin,
  nivelPapelConta,
  podeAlterarPapelDeConta,
  podeCriarContaComPapel,
  type PapelConta,
} from "@central-reforma/domain";

export class AcessoAdminNegadoError extends Error {
  constructor(message = "Você não tem permissão para fazer isso.") {
    super(message);
    this.name = "AcessoAdminNegadoError";
  }
}

/** Busca o papel de conta atual, sempre direto no banco (nunca do JWT). */
export async function papelContaAtual(usuarioId: string): Promise<PapelConta> {
  const [linha] = await db
    .select({ papel: schema.usuarios.papel })
    .from(schema.usuarios)
    .where(eq(schema.usuarios.id, usuarioId))
    .limit(1);
  return (linha?.papel as PapelConta) ?? "USUARIO";
}

/** Garante que `usuarioId` tem papel de conta >= `papelMinimo`. */
export async function requirePapelConta(usuarioId: string, papelMinimo: PapelConta): Promise<PapelConta> {
  const papel = await papelContaAtual(usuarioId);
  if (nivelPapelConta(papel) < nivelPapelConta(papelMinimo)) {
    throw new AcessoAdminNegadoError();
  }
  return papel;
}

async function contarSuperAdmins(): Promise<number> {
  const [linha] = await db
    .select({ total: count() })
    .from(schema.usuarios)
    .where(eq(schema.usuarios.papel, "SUPERADMIN"));
  return linha?.total ?? 0;
}

/**
 * Bootstrap idempotente: se por algum motivo não existe nenhum SUPERADMIN
 * (banco novo, migração aplicada sobre dados antigos sem RBAC), promove a
 * conta mais antiga automaticamente — nunca rebaixa ninguém, só garante que
 * sempre existe alguém capaz de abrir o painel administrativo. Seguro de
 * chamar a cada carregamento do painel: sem custo quando já há SUPERADMIN.
 */
export async function garantirSuperAdminInicial(): Promise<void> {
  const total = await contarSuperAdmins();
  if (total > 0) return;

  const [maisAntigo] = await db
    .select({ id: schema.usuarios.id })
    .from(schema.usuarios)
    .orderBy(schema.usuarios.criadoEm)
    .limit(1);
  if (!maisAntigo) return;

  await db.update(schema.usuarios).set({ papel: "SUPERADMIN" }).where(eq(schema.usuarios.id, maisAntigo.id));
  await registrarAuditoria({
    atorUsuarioId: maisAntigo.id,
    acao: "SUPERADMIN_BOOTSTRAP",
    alvoUsuarioId: maisAntigo.id,
    detalhe: "Promovido automaticamente a SUPERADMIN por ser a conta mais antiga e não existir nenhum SUPERADMIN.",
  });
}

export async function registrarAuditoria(entrada: {
  atorUsuarioId: string;
  acao: string;
  alvoUsuarioId?: string;
  detalhe: string;
}): Promise<void> {
  await db.insert(schema.auditoriaLog).values(entrada);
}

/**
 * Altera o papel de `alvoUsuarioId`. Lança AcessoAdminNegadoError se o ator
 * não tiver privilégio (só SUPERADMIN altera papel — ver
 * podeAlterarPapelDeConta) ou se a alteração deixaria o sistema sem nenhum
 * SUPERADMIN.
 */
export async function alterarPapelUsuario(
  atorUsuarioId: string,
  alvoUsuarioId: string,
  novoPapel: PapelConta,
): Promise<{ error?: string }> {
  const atorPapel = await papelContaAtual(atorUsuarioId);
  if (!podeAlterarPapelDeConta(atorPapel)) {
    throw new AcessoAdminNegadoError();
  }

  const [alvo] = await db
    .select({ id: schema.usuarios.id, papel: schema.usuarios.papel, nome: schema.usuarios.nome })
    .from(schema.usuarios)
    .where(eq(schema.usuarios.id, alvoUsuarioId))
    .limit(1);
  if (!alvo) return { error: "Usuário não encontrado." };

  const papelAtualDoAlvo = alvo.papel as PapelConta;
  if (papelAtualDoAlvo === novoPapel) return {};

  const totalSuperAdmins = await contarSuperAdmins();
  if (alteracaoDeixariaSemSuperAdmin(papelAtualDoAlvo, novoPapel, totalSuperAdmins)) {
    return { error: "Não é possível rebaixar o último Super admin do sistema." };
  }

  await db.update(schema.usuarios).set({ papel: novoPapel }).where(eq(schema.usuarios.id, alvoUsuarioId));
  await registrarAuditoria({
    atorUsuarioId,
    acao: "PAPEL_ALTERADO",
    alvoUsuarioId,
    detalhe: `${alvo.nome}: ${papelAtualDoAlvo} → ${novoPapel}`,
  });

  return {};
}

export { podeCriarContaComPapel };
