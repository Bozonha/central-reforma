"use server";

import { db, schema } from "@central-reforma/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/actions";
import { requireObraAccess } from "../auth/obra-access";

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

export type ResultadoAnalisePlanta =
  | { ok: true; observacoesGerais: string | null; ambientes: AmbienteAnalisado[] }
  | { ok: false; erro: string };

const MIME_SUPORTADOS = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

// Modelo gratuito do Gemini (Google AI Studio): 15 req/min, 1.500 req/dia,
// mais do que suficiente para o uso de uma obra real. Ver GEMINI_API_KEY
// nas variáveis de ambiente do projeto na Vercel.
const GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `Você é um assistente técnico que lê plantas baixas (imagem ou PDF) de apartamentos ou casas e extrai os ambientes com suas dimensões, quando visíveis na própria planta.

REGRAS QUE VOCÊ DEVE SEGUIR SEMPRE:
- Nunca invente uma medida. Se uma cota não estiver legível, não existir, ou você só puder estimar por proporção visual (sem escala confiável), deixe claro isso no campo "confianca" e explique em "observacoes".
- "confianca" para cada ambiente:
  - "ALTA": há uma cota numérica explícita na planta para essa dimensão.
  - "MEDIA": não há cota explícita, mas dá para estimar com razoável segurança pela escala indicada na planta (ex.: barra de escala, ou outra cota próxima conhecida).
  - "BAIXA": estimativa grosseira só por proporção visual entre ambientes, sem escala confiável.
  - "NAO_LEGIVEL": não foi possível determinar nada, mesmo aproximado.
- Quando a confiança for "NAO_LEGIVEL", os campos larguraM/comprimentoM/alturaM devem ser null — não crave um número mesmo assim.
- Use nomes de ambiente em português, como aparecem na planta ou o mais próximo disso (ex.: "Sala", "Cozinha", "Quarto 1", "Suíte", "Banheiro", "Varanda", "Área de serviço", "Circulação").
- Dimensões em metros (não centímetros), com até 2 casas decimais.
- pé-direito (altura) raramente aparece em planta baixa 2D — se não estiver indicado, retorne null com confiança "NAO_LEGIVEL" para esse campo específico, mesmo que largura/comprimento tenham outra confiança.
- Retorne SOMENTE um JSON válido, sem nenhum texto antes ou depois, exatamente neste formato:
{
  "observacoesGerais": "string ou null — observações sobre a planta como um todo (qualidade da imagem, escala ausente, ambiguidades)",
  "ambientes": [
    {"nome": "string", "larguraM": number|null, "comprimentoM": number|null, "alturaM": number|null, "confianca": "ALTA"|"MEDIA"|"BAIXA"|"NAO_LEGIVEL", "observacoes": "string ou null"}
  ]
}`;

function extrairJson(texto: string): { observacoesGerais?: string | null; ambientes?: AmbienteExtraido[] } | null {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim < inicio) return null;
  try {
    return JSON.parse(texto.slice(inicio, fim + 1));
  } catch {
    return null;
  }
}

/**
 * Chama a API gratuita do Gemini (Google AI Studio) com a imagem/PDF da
 * planta em base64 e devolve o texto bruto da resposta. Lança um erro com
 * prefixo "SEM_CHAVE" se a variável de ambiente não estiver configurada,
 * para o chamador distinguir isso de um erro de rede/quota.
 */
async function chamarGemini(base64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("SEM_CHAVE");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const resposta = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: "Analise esta planta baixa e retorne o JSON conforme instruído no system prompt." },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    if (resposta.status === 429) {
      throw new Error("COTA_EXCEDIDA");
    }
    throw new Error(`GEMINI_HTTP_${resposta.status}: ${corpo.slice(0, 300)}`);
  }

  const json = await resposta.json();
  const partes = json?.candidates?.[0]?.content?.parts as Array<{ text?: string }> | undefined;
  const texto = partes?.map((p) => p.text ?? "").join("") ?? "";
  if (!texto) {
    throw new Error("RESPOSTA_VAZIA");
  }
  return texto;
}

/**
 * Lê uma planta (documento tipo PLANTA já enviado) com o Gemini (visão,
 * camada gratuita), extrai os ambientes com dimensões estimadas e
 * grava/atualiza os Ambientes da obra com fonteMedida = "VISAO_ESTIMADA".
 * Nunca marca nada como confirmado — é sempre uma estimativa que precisa
 * ser conferida.
 */
export async function analisarPlanta(obraId: string, documentoId: string): Promise<ResultadoAnalisePlanta> {
  const sessao = await requireSession();
  await requireObraAccess(sessao.usuarioId, obraId, "COLABORADOR");

  const [doc] = await db
    .select()
    .from(schema.documentos)
    .where(and(eq(schema.documentos.id, documentoId), eq(schema.documentos.obraId, obraId)))
    .limit(1);

  if (!doc) return { ok: false, erro: "Documento não encontrado." };
  if (doc.tipo !== "PLANTA") return { ok: false, erro: "Este documento não está marcado como planta (tipo PLANTA)." };
  if (!MIME_SUPORTADOS.has(doc.mimeType)) {
    return { ok: false, erro: "Formato não suportado para análise por IA — use imagem (JPG/PNG/WEBP) ou PDF." };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      ok: false,
      erro: "A variável de ambiente GEMINI_API_KEY não está configurada no servidor. Gere uma chave gratuita em aistudio.google.com/apikey, configure-a nas variáveis de ambiente do projeto na Vercel e tente de novo.",
    };
  }

  let base64: string;
  try {
    const resposta = await fetch(doc.arquivoUrl);
    if (!resposta.ok) throw new Error(String(resposta.status));
    const bytes = Buffer.from(await resposta.arrayBuffer());
    base64 = bytes.toString("base64");
  } catch {
    return { ok: false, erro: "Não consegui baixar o arquivo da planta para analisar." };
  }

  let textoResposta: string;
  try {
    textoResposta = await chamarGemini(base64, doc.mimeType);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "desconhecido";
    if (mensagem === "SEM_CHAVE") {
      return {
        ok: false,
        erro: "A variável de ambiente GEMINI_API_KEY não está configurada no servidor. Gere uma chave gratuita em aistudio.google.com/apikey, configure-a nas variáveis de ambiente do projeto na Vercel e tente de novo.",
      };
    }
    if (mensagem === "COTA_EXCEDIDA") {
      return { ok: false, erro: "A cota gratuita do Gemini foi atingida por agora. Tente novamente em alguns minutos." };
    }
    return { ok: false, erro: `Erro ao chamar a IA: ${mensagem}.` };
  }

  const parsed = extrairJson(textoResposta);
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
      `Estimado por IA (Gemini) a partir de "${doc.nomeArquivo}" em ${agora}.`,
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

  await db.update(schema.documentos).set({ extraidoPor: "IA" }).where(eq(schema.documentos.id, documentoId));

  revalidatePath("/documentos");
  revalidatePath("/ambientes");
  revalidatePath(`/obras/${obraId}`);

  return { ok: true, observacoesGerais: parsed.observacoesGerais ?? null, ambientes: resultado };
}
