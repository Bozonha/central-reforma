import { ErroProvedorIA, type ArquivoParaAnalise, type ProvedorIA } from "./types";

/**
 * Groq (inferência rápida, Llama 4 Scout com visão), camada gratuita
 * (30 req/min, 1.000 req/dia). API compatível com OpenAI. Não suporta
 * PDF — só imagem.
 */
const MIMES_SUPORTADOS = new Set(["image/jpeg", "image/png", "image/webp"]);

const MODELO = "meta-llama/llama-4-scout-17b-16e-instruct";
const NOME = "groq-llama4-scout";

export const groqLlama4Scout: ProvedorIA = {
  nome: NOME,
  mimesSuportados: MIMES_SUPORTADOS,
  async analisar(arquivo: ArquivoParaAnalise, promptSistema: string, promptUsuario: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new ErroProvedorIA("SEM_CHAVE", NOME);
    }

    let resposta: Response;
    try {
      resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODELO,
          messages: [
            { role: "system", content: promptSistema },
            {
              role: "user",
              content: [
                { type: "text", text: promptUsuario },
                { type: "image_url", image_url: { url: `data:${arquivo.mimeType};base64,${arquivo.base64}` } },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 4096,
        }),
      });
    } catch (erro) {
      throw new ErroProvedorIA("INDISPONIVEL", NOME, erro instanceof Error ? erro.message : "falha de rede");
    }

    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      if (resposta.status === 429) {
        throw new ErroProvedorIA("COTA_EXCEDIDA", NOME, corpo.slice(0, 300));
      }
      if (resposta.status === 503 || resposta.status === 502 || resposta.status === 504) {
        throw new ErroProvedorIA("INDISPONIVEL", NOME, corpo.slice(0, 300));
      }
      throw new ErroProvedorIA("ERRO", NOME, `HTTP_${resposta.status}: ${corpo.slice(0, 300)}`);
    }

    const json = await resposta.json();
    const texto = json?.choices?.[0]?.message?.content as string | undefined;
    if (!texto) {
      throw new ErroProvedorIA("ERRO", NOME, "resposta vazia");
    }
    return texto;
  },
};
