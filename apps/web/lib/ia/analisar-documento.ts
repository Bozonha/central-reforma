"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";
import { analisarComCascata, TodosProvedoresFalharamError, type TentativaCascata } from "./cascata";
import { PROMPT_GENERICO, PROMPT_GENERICO_USUARIO, PROMPT_PLANTA, PROMPT_PLANTA_USUARIO } from "./prompts";

type Confianca = "ALTA" | "MEDIA" | "BAIXA" | "NAO_LEGIVEL";

type AmbienteExtraido = {
  nome: string;
  larguraM: number | null;
  comprimentoM: number | null;
  alturaM: number | null;
  confianca: Confianca;
  observacoes: string | null;
};

export type AmbienteAnalisado = AmbienteExtraido & { acao: "CRIADO" | "ATUALIZADO" };

type ResultadoPlanta = {
  ok: true;
  tipo: "PLANTA";
  observacoesGerais: string | null;
  ambientes: AmbienteAnalisado[];
  provedor: string;
};

type ResultadoGenerico = {
  ok: true;
  tipo: "GENERICO";
  tipoIdentificado: string | null;
  resumo: string;
  pontosChave: string[];
  valores: string[];
  alertas: string[];
  provedor: string;
};

export type ResultadoAnaliseDocumento = ResultadoPlanta | ResultadoGenerico | { ok: false; erro: string };

/** Mantido por compatibilidade com código/tipos existentes que ainda importam o nome antigo. */
export type ResultadoAnalisePlanta = ResultadoAnaliseDocumento;

// Imagem: JPEG/PNG/WEBP são aceitos por todos os provedores da cascata.
// PDF só é lido pelo Gemini — para os demais tipos de documento (recibo,
// nota, contrato...) isso ainda cobre a maioria dos casos reais (fotos de
// celular), e quando o único candidato para PDF (Gemini) falha, o erro
// final explica isso claramente em vez de silenciosamente pular.
const MIME_SUPORTADOS = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function extrairJson<T>(texto: string): T | null {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim < inicio) return null;
  try {
    return JSON.parse(texto.slice(inicio, fim + 1)) as T;
  } catch {
    return null;
  }
}

/** Mensagem de erro amigável a partir do histórico de tentativas da cascata. */
function mensagemFalhaTotal(tentativas: TentativaCascata[]): string {
  const nenhumaChaveConfigurada = tentativas.length === 0;
  if (nenhumaChaveConfigurada) {
    return "Nenhum provedor de IA está configurado no servidor. Configure ao menos GEMINI_API_KEY (gratuita, gerada em aistudio.google.com/apikey) nas variáveis de ambiente do projeto na Vercel.";
  }
  const cotaEmTodos = tentativas.every((t) => t.erro === "COTA_EXCEDIDA");
  if (cotaEmTodos) {
    return "A cota gratuita de todos os provedores de IA configurados foi atingida por agora. Tente novamente em alguns minutos.";
  }
  const resumo = tentativas.map((t) => `${t.provedor} (${t.erro})`).join(", ");
  return `Não foi possível analisar o documento — todos os provedores de IA disponíveis falharam: ${resumo}. Tente novamente em alguns minutos.`;
}

async function baixarArquivo(url: string): Promise<string | null> {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(String(resposta.status));
    const bytes = Buffer.from(await resposta.arrayBuffer());
    return bytes.toString("base64");
  } catch {
    return null;
  }
}

async function analisarPlantaInterno(
  obraId: string,
  documentoId: string,
  doc: typeof schema.documentos.$inferSelect,
  base64: string,
): Promise<ResultadoAnaliseDocumento> {
  type SaidaPlanta = { observacoesGerais?: string | null; ambientes?: AmbienteExtraido[] };

  let cascataResultado;
  try {
    cascataResultado = await analisarComCascata({ base64, mimeType: doc.mimeType }, PROMPT_PLANTA, PROMPT_PLANTA_USUARIO);
  } catch (erro) {
    if (erro instanceof TodosProvedoresFalharamError) {
      return { ok: false, erro: mensagemFalhaTotal(erro.tentativas) };
    }
    return { ok: false, erro: `Erro inesperado ao chamar a IA: ${erro instanceof Error ? erro.message : "desconhecido"}.` };
  }

  const parsed = extrairJson<SaidaPlanta>(cascataResultado.texto);
  if (!parsed || !Array.isArray(parsed.ambientes)) {
    return { ok: false, erro: "A IA não retornou um resultado no formato esperado. Tente novamente." };
  }

  const existentes = await db.select().from(schema.ambientes).where(eq(schema.ambientes.obraId, obraId));
  const resultado: AmbienteAnalisado[] = [];
  const agora = new Date().toLocaleDateString("pt-BR");

  for (const amb of parsed.ambientes) {
    if (!amb.nome || typeof amb.nome !== "string") continue;
    const confianca: Confianca = ["ALTA", "MEDIA", "BAIXA", "NAO_LEGIVEL"].includes(amb.confianca) ? amb.confianca : "NAO_LEGIVEL";
    const legivel = confianca !== "NAO_LEGIVEL";

    const nota = [
      `Estimado por IA (${cascataResultado.provedor}) a partir de "${doc.nomeArquivo}" em ${agora}.`,
      `Confiança: ${confianca}.`,
      amb.observacoes ? String(amb.observacoes) : null,
      "Confirme as medidas presencialmente antes de usar em compras ou orçamento.",
    ]
      .filter(Boolean)
      .join(" ");

    const valores = {
      largura: legivel && typeof amb.larguraM === "number" ? amb.larguraM : null,
      comprimento: legivel && typeof amb.comprimentoM === "number" ? amb.comprimentoM : null,
      altura: legivel && typeof amb.alturaM === "number" ? amb.alturaM : null,
      fonteMedida: "VISAO_ESTIMADA" as const,
      observacoes: nota,
    };

    const existente = existentes.find((e) => e.nome.trim().toLowerCase() === amb.nome.trim().toLowerCase());
    if (existente) {
      await db.update(schema.ambientes).set(valores).where(eq(schema.ambientes.id, existente.id));
      resultado.push({ nome: amb.nome, larguraM: valores.largura, comprimentoM: valores.comprimento, alturaM: valores.altura, confianca, observacoes: amb.observacoes ?? null, acao: "ATUALIZADO" });
    } else {
      await db.insert(schema.ambientes).values({ obraId, nome: amb.nome, ...valores });
      resultado.push({ nome: amb.nome, larguraM: valores.largura, comprimentoM: valores.comprimento, alturaM: valores.altura, confianca, observacoes: amb.observacoes ?? null, acao: "CRIADO" });
    }
  }

  await db.update(schema.documentos).set({ extraidoPor: `IA:${cascataResultado.provedor}` }).where(eq(schema.documentos.id, documentoId));

  revalidatePath("/ambientes");

  return { ok: true, tipo: "PLANTA", observacoesGerais: parsed.observacoesGerais ?? null, ambientes: resultado, provedor: cascataResultado.provedor };
}

async function analisarGenericoInterno(documentoId: string, doc: typeof schema.documentos.$inferSelect, base64: string): Promise<ResultadoAnaliseDocumento> {
  type SaidaGenerica = {
    tipoIdentificado?: string | null;
    resumo?: string;
    pontosChave?: string[];
    valores?: string[];
    alertas?: string[];
  };

  let cascataResultado;
  try {
    cascataResultado = await analisarComCascata({ base64, mimeType: doc.mimeType }, PROMPT_GENERICO, PROMPT_GENERICO_USUARIO);
  } catch (erro) {
    if (erro instanceof TodosProvedoresFalharamError) {
      return { ok: false, erro: mensagemFalhaTotal(erro.tentativas) };
    }
    return { ok: false, erro: `Erro inesperado ao chamar a IA: ${erro instanceof Error ? erro.message : "desconhecido"}.` };
  }

  const parsed = extrairJson<SaidaGenerica>(cascataResultado.texto);
  if (!parsed || typeof parsed.resumo !== "string") {
    return { ok: false, erro: "A IA não retornou um resultado no formato esperado. Tente novamente." };
  }

  const resultado: ResultadoGenerico = {
    ok: true,
    tipo: "GENERICO",
    tipoIdentificado: typeof parsed.tipoIdentificado === "string" ? parsed.tipoIdentificado : null,
    resumo: parsed.resumo,
    pontosChave: Array.isArray(parsed.pontosChave) ? parsed.pontosChave.filter((s) => typeof s === "string") : [],
    valores: Array.isArray(parsed.valores) ? parsed.valores.filter((s) => typeof s === "string") : [],
    alertas: Array.isArray(parsed.alertas) ? parsed.alertas.filter((s) => typeof s === "string") : [],
    provedor: cascataResultado.provedor,
  };

  // Grava só um resumo textual em `classificacao` — nunca escreve em
  // compras/orçamento/ambientes a partir de um documento genérico, isso
  // exigiria julgamento humano (regra 1 do CLAUDE.md).
  const agora = new Date().toLocaleDateString("pt-BR");
  const classificacao = [
    resultado.tipoIdentificado ?? "Documento",
    `— ${resultado.resumo}`,
    `(analisado por IA em ${agora}, via ${cascataResultado.provedor})`,
  ].join(" ");

  await db
    .update(schema.documentos)
    .set({ classificacao, extraidoPor: `IA:${cascataResultado.provedor}` })
    .where(eq(schema.documentos.id, documentoId));

  return resultado;
}

/**
 * Analisa um documento já enviado (qualquer tipo) com uma cascata de
 * provedores de IA gratuitos (Gemini em 3 modelos, depois Mistral, Groq e
 * OpenRouter como redundância) e grava o resultado:
 * - PLANTA: extrai ambientes com dimensões e grava/atualiza em Ambientes
 *   (fonteMedida = "VISAO_ESTIMADA", nunca CONFIRMADA).
 * - Qualquer outro tipo: gera um resumo estruturado e grava só em
 *   `documentos.classificacao` — nunca escreve automaticamente em
 *   compras, orçamento ou outra tabela de negócio.
 */
export async function analisarDocumento(obraId: string, documentoId: string): Promise<ResultadoAnaliseDocumento> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const [doc] = await db
    .select()
    .from(schema.documentos)
    .where(and(eq(schema.documentos.id, documentoId), eq(schema.documentos.obraId, obraId)))
    .limit(1);

  if (!doc) return { ok: false, erro: "Documento não encontrado." };
  if (!MIME_SUPORTADOS.has(doc.mimeType)) {
    return { ok: false, erro: "Formato não suportado para análise por IA — use imagem (JPG/PNG/WEBP) ou PDF." };
  }

  const base64 = await baixarArquivo(doc.arquivoUrl);
  if (!base64) {
    return { ok: false, erro: "Não consegui baixar o arquivo para analisar." };
  }

  const resultado = doc.tipo === "PLANTA" ? await analisarPlantaInterno(obraId, documentoId, doc, base64) : await analisarGenericoInterno(documentoId, doc, base64);

  revalidatePath("/documentos");
  revalidatePath(`/obras/${obraId}`);

  return resultado;
}

/** Mantido por compatibilidade — encaminha para `analisarDocumento`. Novo código deve chamar `analisarDocumento` diretamente. */
export async function analisarPlanta(obraId: string, documentoId: string): Promise<ResultadoAnaliseDocumento> {
  return analisarDocumento(obraId, documentoId);
}
