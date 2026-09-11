import { db, schema } from "@central-reforma/database";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { areaAmbiente, centsToBRL, labelFonteMedida, OBRA_TIPOS } from "@central-reforma/domain";
import { requireSession } from "../../../../lib/auth/actions";
import { requireObraAccess, AcessoNegadoError } from "../../../../lib/auth/obra-access";
import {
  adicionarColaborador,
  arquivarObra,
  criarAmbiente,
  excluirAmbiente,
  reativarObra,
  removerColaborador,
} from "../../../../lib/obras/actions";
import { Card, CardBody, CardHeader } from "../../../components/ui/card";
import { Badge, statusToneMap } from "../../../components/ui/badge";
import { Button, LinkButton } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { Icon } from "../../../components/icons";
import { AmbienteForm } from "../components/ambiente-form";
import { ColaboradorForm } from "../components/colaborador-form";
import Link from "next/link";

export default async function ObraDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await requireSession();

  let colaboracao;
  try {
    colaboracao = await requireObraAccess(sessao.usuarioId, id, "VISUALIZADOR");
  } catch (err) {
    if (err instanceof AcessoNegadoError) notFound();
    throw err;
  }

  const [obra] = await db.select().from(schema.obras).where(eq(schema.obras.id, id)).limit(1);
  if (!obra) notFound();

  const ambientes = await db.select().from(schema.ambientes).where(eq(schema.ambientes.obraId, id));

  const colaboradores = await db
    .select({
      id: schema.obraColaboradores.id,
      papel: schema.obraColaboradores.papel,
      usuarioNome: schema.usuarios.nome,
      usuarioEmail: schema.usuarios.email,
    })
    .from(schema.obraColaboradores)
    .innerJoin(schema.usuarios, eq(schema.usuarios.id, schema.obraColaboradores.usuarioId))
    .where(eq(schema.obraColaboradores.obraId, id));

  const ehDono = colaboracao.papel === "DONO";
  const podeEditar = colaboracao.papel === "DONO" || colaboracao.papel === "COLABORADOR";
  const tipoLabel = OBRA_TIPOS.find((t) => t.value === obra.tipo)?.label ?? obra.tipo;
  const areaTotal = ambientes.reduce((acc, a) => acc + (areaAmbiente(a.largura, a.comprimento) ?? 0), 0);

  const criarAmbienteComObra = criarAmbiente.bind(null, id);
  const adicionarColaboradorComObra = adicionarColaborador.bind(null, id);
  const arquivarComObra = arquivarObra.bind(null, id);
  const reativarComObra = reativarObra.bind(null, id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--color-text)]">{obra.nome}</h1>
            <Badge tone={statusToneMap(obra.status)}>{obra.status === "ATIVA" ? "Ativa" : "Arquivada"}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            {tipoLabel}
            {obra.cidade ? ` · ${obra.cidade}${obra.estado ? `, ${obra.estado}` : ""}` : ""}
          </p>
        </div>
        {podeEditar ? (
          <div className="flex gap-2">
            <LinkButton href={`/obras/${id}/editar`} variant="secondary" icon="edit">
              Editar
            </LinkButton>
            {ehDono ? (
              <form action={obra.status === "ATIVA" ? arquivarComObra : reativarComObra}>
                <Button type="submit" variant="outline" icon="archive">
                  {obra.status === "ATIVA" ? "Arquivar" : "Reativar"}
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Orçamento</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">
              {obra.orcamentoTotalCent != null ? centsToBRL(obra.orcamentoTotalCent) : "—"}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Ambientes</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{ambientes.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Área total</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{areaTotal > 0 ? `${areaTotal.toFixed(2)} m²` : "—"}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Colaboradores</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{colaboradores.length}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { href: `/orcamento?obraId=${id}`, icon: "orcamento" as const, label: "Orçamento" },
          { href: `/compras?obraId=${id}`, icon: "compras" as const, label: "Compras" },
          { href: `/estoque?obraId=${id}`, icon: "estoque" as const, label: "Estoque" },
          { href: `/cronograma?obraId=${id}`, icon: "cronograma" as const, label: "Cronograma" },
          { href: `/documentos?obraId=${id}`, icon: "documentos" as const, label: "Documentos" },
          { href: `/diario?obraId=${id}`, icon: "diario" as const, label: "Diário" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <Icon name={link.icon} className="h-4 w-4 text-[var(--color-text-faint)]" />
            {link.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader title="Ambientes" description="A área é sempre calculada a partir de largura × comprimento." />
        <CardBody className="flex flex-col gap-4">
          {podeEditar ? <AmbienteForm action={criarAmbienteComObra} /> : null}
          {ambientes.length === 0 ? (
            <EmptyState icon="ambientes" title="Nenhum ambiente ainda" description="Adicione o primeiro ambiente desta obra acima." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                    <th className="py-2 font-medium">Nome</th>
                    <th className="py-2 font-medium">Dimensões</th>
                    <th className="py-2 font-medium">Área</th>
                    <th className="py-2 font-medium">Medida</th>
                    {podeEditar ? <th className="py-2" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {ambientes.map((a) => {
                    const area = areaAmbiente(a.largura, a.comprimento);
                    return (
                      <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="py-2.5 font-medium text-[var(--color-text)]">{a.nome}</td>
                        <td className="py-2.5 text-[var(--color-text-muted)]">
                          {a.largura && a.comprimento ? `${a.largura}m × ${a.comprimento}m` : "—"}
                        </td>
                        <td className="py-2.5 text-[var(--color-text-muted)]">{area != null ? `${area.toFixed(2)} m²` : "—"}</td>
                        <td className="py-2.5">
                          <Badge tone="neutral">{labelFonteMedida(a.fonteMedida as any)}</Badge>
                        </td>
                        {podeEditar ? (
                          <td className="py-2.5 text-right">
                            <form action={excluirAmbiente.bind(null, id, a.id)}>
                              <button type="submit" className="rounded-md p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-serious-soft)] hover:text-[var(--color-serious)]">
                                <Icon name="trash" className="h-4 w-4" />
                              </button>
                            </form>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Colaboradores" description="Quem pode ver ou editar esta obra." />
        <CardBody className="flex flex-col gap-4">
          {ehDono ? <ColaboradorForm action={adicionarColaboradorComObra} /> : null}
          <div className="flex flex-col gap-2">
            {colaboradores.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{c.usuarioNome}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{c.usuarioEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={c.papel === "DONO" ? "primary" : "neutral"}>{c.papel}</Badge>
                  {ehDono && c.papel !== "DONO" ? (
                    <form action={removerColaborador.bind(null, id, c.id)}>
                      <button type="submit" className="rounded-md p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-serious-soft)] hover:text-[var(--color-serious)]">
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {obra.observacoes ? (
        <Card>
          <CardHeader title="Observações" />
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-[var(--color-text-muted)]">{obra.observacoes}</p>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
