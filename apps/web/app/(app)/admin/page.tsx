import { db, schema } from "@central-reforma/database";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { labelPapelConta, podeAcessarPainelAdmin, type PapelConta } from "@central-reforma/domain";
import { requireSession } from "../../../lib/auth/actions";
import { garantirSuperAdminInicial, papelContaAtual } from "../../../lib/auth/rbac";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CriarUsuarioForm } from "./components/criar-usuario-form";
import { UsuariosTabela } from "./components/usuarios-tabela";

export default async function AdminPage() {
  const sessao = await requireSession();

  // Garante que sempre existe ao menos um SUPERADMIN antes de checar
  // permissão — banco novo ou migrado sem RBAC não deve travar todo mundo
  // fora do painel (ver lib/auth/rbac.ts#garantirSuperAdminInicial).
  await garantirSuperAdminInicial();

  const meuPapel = await papelContaAtual(sessao.usuarioId);
  if (!podeAcessarPainelAdmin(meuPapel)) {
    notFound();
  }

  const usuarios = await db
    .select({
      id: schema.usuarios.id,
      nome: schema.usuarios.nome,
      email: schema.usuarios.email,
      papel: schema.usuarios.papel,
      criadoEm: schema.usuarios.criadoEm,
    })
    .from(schema.usuarios)
    .orderBy(desc(schema.usuarios.criadoEm));

  const auditoria =
    meuPapel === "SUPERADMIN"
      ? await db
          .select({
            id: schema.auditoriaLog.id,
            acao: schema.auditoriaLog.acao,
            detalhe: schema.auditoriaLog.detalhe,
            criadoEm: schema.auditoriaLog.criadoEm,
            atorNome: schema.usuarios.nome,
          })
          .from(schema.auditoriaLog)
          .innerJoin(schema.usuarios, eq(schema.auditoriaLog.atorUsuarioId, schema.usuarios.id))
          .orderBy(desc(schema.auditoriaLog.criadoEm))
          .limit(20)
      : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Administração</h1>
          <Badge tone="primary">{labelPapelConta(meuPapel)}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          {meuPapel === "SUPERADMIN"
            ? "Painel completo: crie contas de qualquer papel e altere o papel de quem já existe."
            : "Você pode adicionar novas contas de usuário. Alterar papéis é exclusivo do Super admin."}
        </p>
      </div>

      <Card>
        <CardHeader title="Adicionar conta" description={meuPapel === "SUPERADMIN" ? "Escolha o papel da nova conta." : "A nova conta nasce como Usuário."} />
        <CardBody>
          <CriarUsuarioForm podeEscolherAdmin={meuPapel === "SUPERADMIN"} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Contas" description={`${usuarios.length} conta${usuarios.length === 1 ? "" : "s"} no sistema.`} />
        <CardBody>
          <UsuariosTabela
            usuarios={usuarios.map((u) => ({ ...u, papel: u.papel as PapelConta }))}
            meuId={sessao.usuarioId}
            souSuperAdmin={meuPapel === "SUPERADMIN"}
          />
        </CardBody>
      </Card>

      {meuPapel === "SUPERADMIN" && auditoria.length > 0 ? (
        <Card>
          <CardHeader title="Log de auditoria" description="Últimas 20 mudanças de conta e papel." />
          <CardBody className="flex flex-col gap-2">
            {auditoria.map((entrada) => (
              <div key={entrada.id} className="flex flex-col gap-0.5 border-b border-[var(--color-border)] py-2 text-sm last:border-0">
                <p className="text-[var(--color-text)]">{entrada.detalhe}</p>
                <p className="text-xs text-[var(--color-text-faint)]">
                  {entrada.acao} · {entrada.atorNome} ·{" "}
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(entrada.criadoEm)}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
