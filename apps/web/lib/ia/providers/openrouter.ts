import { ErroProvedorIA, type ArquivoParaAnalise, type ProvedorIA } from "./types";

/**
 * OpenRouter, usando o roteador gratuito `openrouter/free` — um meta-modelo
 * que a própria OpenRouter mapeia para um modelo com visão disponível na
 * camada gratuita no momento da chamada (~20 req/min, 200 req/dia,
 * variando conforme os modelos gratuitos disponíveis). Usamos o alias em
 * vez de fixar um modelo específico porque a lista de modelos gratuitos da
 * OpenRouter muda com frequência — fixar um nome individual quebraria
 * silenciosamente quando o modelo saísse da lista gratuita.
 * Não suporta PDF — só imagem.
 */
const MIMES_SUPORTADOS = new Set(["image/jpeg", "image/png", "image/webp"]);

const MODELO = "openrouter/free";
const NOME = "openrouter-free";

export const openRouterFree: ProvedorIA = {
  nome: NOME,
  mimesSuportados: MIMES_SUPORTADOS,
  async analisar(arquivo: ArquivoParaAnalise, promptSistema: string, promptUsuario: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new ErroProvedorIA("SEM_CHAVE", NOME);
    }

    let resposta: Response;
    try {
      resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
