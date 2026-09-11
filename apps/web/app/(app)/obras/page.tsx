import { db, schema } from "@central-reforma/database";
import { inArray } from "drizzle-orm";
import { centsToBRL, OBRA_TIPOS } from "@central-reforma/domain";
import { requireSession } from "../../../lib/auth/actions";
import { obraIdsDoUsuario } from "../../../lib/auth/obra-access";
import { Card, CardBody } from "../../components/ui/card";
import { Badge, statusToneMap } from "../../components/ui/badge";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import Link from "next/link";

export default async function ObrasPage() {
  const sessao = await requireSession();
  const ids = await obraIdsDoUsuario(sessao.usuarioId);
  const obras = ids.length
    ? await db.select().from(schema.obras).where(inArray(schema.obras.id, ids))
    : [];

  const ativas = obras.filter((o) => o.status === "ATIVA");
  const arquivadas = obras.filter((o) => o.status === "ARQUIVADA");
  const tipoLabel = (tipo: string) => OBRA_TIPOS.find((t) => t.value === tipo)?.label ?? tipo;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Obras</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Todas as reformas que você acompanha.</p>
        </div>
        <LinkButton href="/obras/nova" icon="plus">
          Nova obra
        </LinkButton>
      </div>

      {obras.length === 0 ? (
        <Card>
          <EmptyState
            icon="obras"
            title="Nenhuma obra ainda"
            description="Crie sua primeira obra para começar a organizar ambientes, orçamento e compras."
            action={
              <LinkButton href="/obras/nova" icon="plus">
                Criar primeira obra
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ativas.map((obra) => (
            <Link key={obra.id} href={`/obras/${obra.id}`}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-raised)]">
                <CardBody className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">{obra.nome}</h3>
                    <Badge tone={statusToneMap(obra.status)}>{obra.status === "ATIVA" ? "Ativa" : "Arquivada"}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">{tipoLabel(obra.tipo)}</p>
                  {obra.cidade ? (
                    <p className="text-xs text-[var(--color-text-faint)]">{obra.cidade}{obra.estado ? `, ${obra.estado}` : ""}</p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs">
                    <span className="text-[var(--color-text-muted)]">Orçamento</span>
                    <span className="font-medium text-[var(--color-text)]">
                      {obra.orcamentoTotalCent != null ? centsToBRL(obra.orcamentoTotalCent) : "Não definido"}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {arquivadas.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-muted)]">Arquivadas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {arquivadas.map((obra) => (
              <Link key={obra.id} href={`/obras/${obra.id}`}>
                <Card className="h-full opacity-70 transition-opacity hover:opacity-100">
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[var(--color-text)]">{obra.nome}</h3>
                      <Badge tone="neutral">Arquivada</Badge>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
