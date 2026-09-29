/**
 * RBAC de CONTA (global) — não confundir com PapelColaborador (por Obra, ver
 * types.ts/ObraColaborador). Regras determinísticas e puras (CLAUDE.md #3):
 * quem pode ver o painel administrativo, criar outra conta ADMIN, alterar o
 * papel de alguém. A aplicação (apps/web/lib/auth/rbac.ts) é responsável por
 * buscar o papel atual no banco antes de chamar estas funções — elas nunca
 * tocam banco, sessão ou request.
 */

export type PapelConta = "SUPERADMIN" | "ADMIN" | "USUARIO";

export const PAPEIS_CONTA: PapelConta[] = ["SUPERADMIN", "ADMIN", "USUARIO"];

const NIVEL_PAPEL_CONTA: Record<PapelConta, number> = {
  USUARIO: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
};

export function nivelPapelConta(papel: PapelConta): number {
  return NIVEL_PAPEL_CONTA[papel];
}

export function labelPapelConta(papel: PapelConta): string {
  if (papel === "SUPERADMIN") return "Super admin";
  if (papel === "ADMIN") return "Admin";
  return "Usuário";
}

/** SUPERADMIN e ADMIN têm acesso ao painel administrativo; USUARIO não. */
export function podeAcessarPainelAdmin(papel: PapelConta): boolean {
  return papel === "SUPERADMIN" || papel === "ADMIN";
}

/**
 * Só SUPERADMIN cria outra conta ADMIN (ou SUPERADMIN) — regra explícita do
 * produto: "só ele pode criar admin". ADMIN só cria contas USUARIO.
 */
export function podeCriarContaComPapel(atorPapel: PapelConta, papelDaNovaConta: PapelConta): boolean {
  if (atorPapel === "SUPERADMIN") return true;
  if (atorPapel === "ADMIN") return papelDaNovaConta === "USUARIO";
  return false;
}

/**
 * Só SUPERADMIN altera o papel de uma conta já existente (promover,
 * rebaixar). ADMIN não tem esse poder — "admin já tem menos poder" — ele só
 * adiciona usuários novos (nível USUARIO), nunca reclassifica alguém.
 */
export function podeAlterarPapelDeConta(atorPapel: PapelConta): boolean {
  return atorPapel === "SUPERADMIN";
}

/**
 * Trava adicional (aplicada com a contagem real de SUPERADMINs, que a
 * função pura não tem como saber): nunca permitir que a alteração deixe o
 * sistema sem nenhum SUPERADMIN. Chamada pela camada de aplicação como
 * `!(alvoEhSuperAdmin && novoPapel !== "SUPERADMIN" && totalSuperAdmins <= 1)`.
 */
export function alteracaoDeixariaSemSuperAdmin(
  papelAtualDoAlvo: PapelConta,
  novoPapel: PapelConta,
  totalSuperAdminsAtual: number,
): boolean {
  return papelAtualDoAlvo === "SUPERADMIN" && novoPapel !== "SUPERADMIN" && totalSuperAdminsAtual <= 1;
}
