import { db, schema } from "@central-reforma/database";
import { eq, inArray } from "drizzle-orm";
import { areaAmbiente } from "@central-reforma/domain";
import { requireSession } from "../../../lib/auth/actions";
import { obraIdsDoUsuario } from "../../../lib/auth/obra-access";
import { Card, CardBody } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import Link from "next/link";

export default async function AmbientesPage() {
  const sessao = await requireSession();
  const ids = await obraIdsDoUsuario(sessao.usuarioId);

  const linhas = ids.length
    ? await db
        .select({
          id: schema.ambientes.id,
          nome: schema.ambientes.nome,
          largura: schema.ambientes.largura,
          comprimento: schema.ambientes.comprimento,
          obraId: schema.ambientes.obraId,
          obraNome: schema.obras.nome,
        })
        .from(schema.ambientes)
        .innerJoin(schema.obras, eq(schema.obras.id, schema.ambientes.obraId))
        .where(inArray(schema.ambientes.obraId, ids))
    : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Ambientes</h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Todos os ambientes de todas as suas obras.</p>
      </div>

      {linhas.length === 0 ? (
        <Card>
          <EmptyState
            icon="ambientes"
            title="Nenhum ambiente ainda"
            description="Ambientes são criados dentro de uma obra."
            action={
              <LinkButton href="/obras" icon="obras">
                Ver obras
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {linhas.map((a) => {
            const area = areaAmbiente(a.largura, a.comprimento);
            return (
              <Link key={a.id} href={`/obras/${a.obraId}`}>
                <Card className="h-full transition-shadow hover:shadow-[var(--shadow-raised)]">
                  <CardBody>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{a.nome}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{a.obraNome}</p>
                    <p className="mt-3 text-xs text-[var(--color-text-faint)]">{area != null ? `${area.toFixed(2)} m²` : "Sem medidas"}</p>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
