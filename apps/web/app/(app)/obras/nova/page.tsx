import { Card, CardBody, CardHeader } from "../../../components/ui/card";
import { ObraForm } from "../components/obra-form";
import { criarObra } from "../../../../lib/obras/actions";

export default async function NovaObraPage({
  searchParams,
}: {
  searchParams: Promise<{ primeira?: string }>;
}) {
  const { primeira } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      {primeira ? (
        <div className="mb-4 rounded-lg border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-primary)]">
          Conta criada! Vamos começar com sua primeira obra.
        </div>
      ) : null}
      <Card>
        <CardHeader title="Nova obra" description="Dê um nome e alguns detalhes — você pode editar tudo depois." />
        <CardBody>
          <ObraForm action={criarObra} submitLabel="Criar obra" />
        </CardBody>
      </Card>
    </div>
  );
}
