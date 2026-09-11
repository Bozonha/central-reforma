import { db, schema } from "@central-reforma/database";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireSession } from "../../../../../lib/auth/actions";
import { requireObraAccess, AcessoNegadoError } from "../../../../../lib/auth/obra-access";
import { atualizarObra } from "../../../../../lib/obras/actions";
import { Card, CardBody, CardHeader } from "../../../../components/ui/card";
import { ObraForm } from "../../components/obra-form";

export default async function EditarObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await requireSession();

  try {
    await requireObraAccess(sessao.usuarioId, id, "COLABORADOR");
  } catch (err) {
    if (err instanceof AcessoNegadoError) notFound();
    throw err;
  }

  const [obra] = await db.select().from(schema.obras).where(eq(schema.obras.id, id)).limit(1);
  if (!obra) notFound();

  const atualizarComObra = atualizarObra.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader title="Editar obra" />
        <CardBody>
          <ObraForm action={atualizarComObra} submitLabel="Salvar alterações" defaults={obra} />
        </CardBody>
      </Card>
    </div>
  );
}
