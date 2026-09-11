import { db, schema } from "@central-reforma/database";
import { desc, eq } from "drizzle-orm";
import { TIPOS_DOCUMENTO } from "@central-reforma/domain";
import { requireSession } from "../../../lib/auth/actions";
import { resolverObraSelecionada } from "../../../lib/obras/selecionar";
import { enviarDocumento, excluirDocumento } from "../../../lib/documentos/actions";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import { Icon } from "../../components/icons";
import { ObraSelector } from "../components/obra-selector";
import { DocumentoForm } from "./components/documento-form";

const TIPO_LABEL = Object.fromEntries(TIPOS_DOCUMENTO.map((t) => [t.value, t.label]));

function formatTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatData(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ obraId?: string }>;
}) {
  const sessao = await requireSession();
  const { obraId: obraIdParam } = await searchParams;
  const { obras, obraId } = await resolverObraSelecionada(sessao.usuarioId, obraIdParam);

  if (!obraId) {
    return (
      <Card>
        <EmptyState
          icon="documentos"
          title="Crie uma obra primeiro"
          description="Os documentos são organizados por obra."
          action={
            <LinkButton href="/obras/nova" icon="plus">
              Nova obra
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const documentos = await db
    .select()
    .from(schema.documentos)
    .where(eq(schema.documentos.obraId, obraId))
    .orderBy(desc(schema.documentos.dataUpload));

  const enviarDocumentoComObra = enviarDocumento.bind(null, obraId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Documentos</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Contratos, notas, orçamentos e plantas da obra.</p>
        </div>
        <ObraSelector obras={obras} obraId={obraId} />
      </div>

      <Card>
        <CardBody>
          <p className="text-xs text-[var(--color-text-muted)]">Documentos enviados</p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{documentos.length}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Arquivos" />
        <CardBody className="flex flex-col gap-4">
          <DocumentoForm action={enviarDocumentoComObra} />
          {documentos.length === 0 ? (
            <EmptyState icon="documentos" title="Nenhum documento ainda" description="Envie o primeiro arquivo acima." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                    <th className="py-2 font-medium">Arquivo</th>
                    <th className="py-2 font-medium">Tipo</th>
                    <th className="py-2 font-medium">Tamanho</th>
                    <th className="py-2 font-medium">Enviado em</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((doc) => (
                    <tr key={doc.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2.5 font-medium text-[var(--color-text)]">
                        <a
                          href={doc.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-[var(--color-primary)] hover:underline"
                        >
                          <Icon name="documentos" className="h-4 w-4 shrink-0 text-[var(--color-text-faint)]" />
                          <span className="truncate">{doc.nomeArquivo}</span>
                        </a>
                      </td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{TIPO_LABEL[doc.tipo] ?? doc.tipo}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{formatTamanho(doc.tamanhoBytes)}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{formatData(doc.dataUpload)}</td>
                      <td className="py-2.5 text-right">
                        <form action={excluirDocumento.bind(null, obraId, doc.id)}>
                          <button
                            type="submit"
                            className="rounded-md p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-serious-soft)] hover:text-[var(--color-serious)]"
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
