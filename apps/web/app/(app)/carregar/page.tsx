import { requireSession } from "../../../lib/auth/actions";
import { resolverObraSelecionada } from "../../../lib/obras/selecionar";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import { ObraSelector } from "../components/obra-selector";
import { CarregarForm } from "./components/carregar-form";

export default async function CarregarPage({ searchParams }: { searchParams: Promise<{ obraId?: string }> }) {
  const sessao = await requireSession();
  const { obraId: obraIdParam } = await searchParams;
  const { obras, obraId } = await resolverObraSelecionada(sessao.usuarioId, obraIdParam);

  if (!obraId) {
    return (
      <Card>
        <EmptyState
          icon="upload"
          title="Crie uma obra primeiro"
          description="Carregar fotos é organizado por obra."
          action={
            <LinkButton href="/obras/nova" icon="plus">
              Nova obra
            </LinkButton>
          }
        />
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Carregar</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Tire uma foto de um recibo, produto ou orçamento — a IA lê e monta um rascunho para você conferir.
          </p>
        </div>
        <ObraSelector obras={obras} obraId={obraId} />
      </div>

      <Card>
        <CardHeader title="Nova foto" description="Escolha a categoria, descreva em uma frase e envie a foto ou um PDF." />
        <CardBody>
          <CarregarForm obraId={obraId} />
        </CardBody>
      </Card>
    </div>
  );
}
