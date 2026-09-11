"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { ambienteSchema, colaboradorSchema, logisticaSchema, obraSchema } from "../validation/obra";
import { reaisToCents } from "@central-reforma/domain";
import { valoresDoFormulario, type FormState } from "../forms/state";

// Reexportado como tipo (sem custo em runtime) para não obrigar todo
// formulário a saber que `FormState` mora em lib/forms/state — um módulo
// "use server" pode reexportar tipos livremente, só não pode reexportar a
// função `valoresDoFormulario` (Next exige que todo export de valor deste
// arquivo seja uma Server Action assíncrona).
export type { FormState };

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseNumberInput(value?: string): number | undefined {
  if (!value) return undefined;
  const normalized = value.replace(",", ".");
  const n = Number(normalized);
  return Number.isNaN(n) ? undefined : n;
}

export async function criarObra(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();

  const parsed = obraSchema.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    orcamentoTotal: formData.get("orcamentoTotal") || undefined,
    dataInicio: formData.get("dataInicio") || undefined,
    dataFimPrevista: formData.get("dataFimPrevista") || undefined,
    observacoes: formData.get("observacoes") || undefined,
    logradouro: formData.get("logradouro") || undefined,
    cidade: formData.get("cidade") || undefined,
    estado: formData.get("estado") || undefined,
    cep: formData.get("cep") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const data = parsed.data;
  const orcamentoCent = data.orcamentoTotal ? reaisToCents(parseNumberInput(data.orcamentoTotal) ?? 0) : null;

  const [obra] = await db
    .insert(schema.obras)
    .values({
      nome: data.nome,
      tipo: data.tipo,
      orcamentoTotalCent: orcamentoCent,
      dataInicio: parseDate(data.dataInicio),
      dataFimPrevista: parseDate(data.dataFimPrevista),
      observacoes: data.observacoes || null,
      logradouro: data.logradouro || null,
      cidade: data.cidade || null,
      estado: data.estado || null,
      cep: data.cep || null,
    })
    .returning();

  if (!obra) {
    return { error: "Não foi possível criar a obra. Tente novamente." };
  }

  // Decisão B.5: o dono é o primeiro ObraColaborador com papel DONO — Obra
  // não tem coluna de dono própria.
  await db.insert(schema.obraColaboradores).values({
    obraId: obra.id,
    usuarioId: sessao.usuarioId,
    papel: "DONO",
    aceitoEm: new Date(),
  });

  revalidatePath("/obras");
  redirect(`/obras/${obra.id}`);
}

export async function atualizarObra(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const parsed = obraSchema.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    orcamentoTotal: formData.get("orcamentoTotal") || undefined,
    dataInicio: formData.get("dataInicio") || undefined,
    dataFimPrevista: formData.get("dataFimPrevista") || undefined,
    observacoes: formData.get("observacoes") || undefined,
    logradouro: formData.get("logradouro") || undefined,
    cidade: formData.get("cidade") || undefined,
    estado: formData.get("estado") || undefined,
    cep: formData.get("cep") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const data = parsed.data;
  const orcamentoCent = data.orcamentoTotal ? reaisToCents(parseNumberInput(data.orcamentoTotal) ?? 0) : null;

  // Endereço mudou? invalida a geocodificação anterior (mapa de lojas próximas
  // precisa recalcular lat/long — nunca reaproveitar coordenada de um
  // endereço antigo).
  const [atual] = await db.select().from(schema.obras).where(eq(schema.obras.id, obraId)).limit(1);
  const enderecoMudou =
    atual &&
    (atual.logradouro !== (data.logradouro || null) ||
      atual.cidade !== (data.cidade || null) ||
      atual.cep !== (data.cep || null));

  await db
    .update(schema.obras)
    .set({
      nome: data.nome,
      tipo: data.tipo,
      orcamentoTotalCent: orcamentoCent,
      dataInicio: parseDate(data.dataInicio) ?? null,
      dataFimPrevista: parseDate(data.dataFimPrevista) ?? null,
      observacoes: data.observacoes || null,
      logradouro: data.logradouro || null,
      cidade: data.cidade || null,
      estado: data.estado || null,
      cep: data.cep || null,
      ...(enderecoMudou ? { latitude: null, longitude: null, geocodificadoEm: null } : {}),
    })
    .where(eq(schema.obras.id, obraId));

  revalidatePath(`/obras/${obraId}`);
  revalidatePath("/obras");
  redirect(`/obras/${obraId}`);
}

export async function arquivarObra(obraId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "DONO");
  await db.update(schema.obras).set({ status: "ARQUIVADA" }).where(eq(schema.obras.id, obraId));
  revalidatePath("/obras");
  revalidatePath(`/obras/${obraId}`);
}

export async function reativarObra(obraId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "DONO");
  await db.update(schema.obras).set({ status: "ATIVA" }).where(eq(schema.obras.id, obraId));
  revalidatePath("/obras");
  revalidatePath(`/obras/${obraId}`);
}

// ---------------------------------------------------------------------------
// Perfil de deslocamento (custo efetivo de ofertas com retirada local —
// packages/domain/src/logistics.ts)
// ---------------------------------------------------------------------------

export async function atualizarLogisticaObra(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const parsed = logisticaSchema.safeParse({
    combustivelPrecoLitro: formData.get("combustivelPrecoLitro") || undefined,
    veiculoKmPorLitro: formData.get("veiculoKmPorLitro") || undefined,
    pedagio: formData.get("pedagio") || undefined,
    estacionamento: formData.get("estacionamento") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const combustivelPrecoLitroCent = parsed.data.combustivelPrecoLitro
    ? reaisToCents(parseNumberInput(parsed.data.combustivelPrecoLitro) ?? 0)
    : null;
  const veiculoKmPorLitro = parsed.data.veiculoKmPorLitro ? (parseNumberInput(parsed.data.veiculoKmPorLitro) ?? null) : null;
  const pedagioCent = parsed.data.pedagio ? reaisToCents(parseNumberInput(parsed.data.pedagio) ?? 0) : null;
  const estacionamentoCent = parsed.data.estacionamento
    ? reaisToCents(parseNumberInput(parsed.data.estacionamento) ?? 0)
    : null;

  await db
    .update(schema.obras)
    .set({ combustivelPrecoLitroCent, veiculoKmPorLitro, pedagioCent, estacionamentoCent })
    .where(eq(schema.obras.id, obraId));

  revalidatePath("/compras");
  return {};
}

// ---------------------------------------------------------------------------
// Ambientes
// ---------------------------------------------------------------------------

export async function criarAmbiente(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const parsed = ambienteSchema.safeParse({
    nome: formData.get("nome"),
    largura: formData.get("largura") || undefined,
    comprimento: formData.get("comprimento") || undefined,
    altura: formData.get("altura") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors, values: valoresDoFormulario(formData) };
  }

  const data = parsed.data;
  await db.insert(schema.ambientes).values({
    obraId,
    nome: data.nome,
    largura: parseNumberInput(data.largura) ?? null,
    comprimento: parseNumberInput(data.comprimento) ?? null,
    altura: parseNumberInput(data.altura) ?? null,
    fonteMedida: "USUARIO",
    observacoes: data.observacoes || null,
  });

  revalidatePath(`/obras/${obraId}`);
  revalidatePath("/ambientes");
  return {};
}

export async function excluirAmbiente(obraId: string, ambienteId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");
  await db
    .delete(schema.ambientes)
    .where(and(eq(schema.ambientes.id, ambienteId), eq(schema.ambientes.obraId, obraId)));
  revalidatePath(`/obras/${obraId}`);
  revalidatePath("/ambientes");
}

// ---------------------------------------------------------------------------
// Colaboradores
// ---------------------------------------------------------------------------

/**
 * Adiciona um colaborador pelo e-mail. Simplificação deliberada: como não há
 * infraestrutura de envio de e-mail nesta etapa, só é possível adicionar
 * alguém que já tem conta na plataforma (o "convite" é aceito
 * automaticamente). Convite assíncrono por e-mail fica para uma etapa
 * futura — documentado em docs/product/roadmap.md.
 */
export async function adicionarColaborador(obraId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "DONO");

  const parsed = colaboradorSchema.safeParse({
    email: formData.get("email"),
    papel: formData.get("papel"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const [usuario] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, parsed.data.email)).limit(1);
  if (!usuario) {
    return { error: "Não existe conta com este e-mail ainda. Peça para a pessoa se cadastrar primeiro." };
  }

  const [jaColabora] = await db
    .select()
    .from(schema.obraColaboradores)
    .where(and(eq(schema.obraColaboradores.obraId, obraId), eq(schema.obraColaboradores.usuarioId, usuario.id)))
    .limit(1);
  if (jaColabora) {
    return { error: "Esta pessoa já colabora nesta obra." };
  }

  await db.insert(schema.obraColaboradores).values({
    obraId,
    usuarioId: usuario.id,
    papel: parsed.data.papel,
    convidadoPorId: sessao.usuarioId,
    aceitoEm: new Date(),
  });

  revalidatePath(`/obras/${obraId}`);
  return {};
}

export async function removerColaborador(obraId: string, colaboradorId: string): Promise<void> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "DONO");
  await db
    .delete(schema.obraColaboradores)
    .where(and(eq(schema.obraColaboradores.id, colaboradorId), eq(schema.obraColaboradores.obraId, obraId)));
  revalidatePath(`/obras/${obraId}`);
}
