import { ErroProvedorIA, type ArquivoParaAnalise, type ProvedorIA } from "./types";

/**
 * Google Gemini (Google AI Studio), camada gratuita. Suporta imagem e PDF
 * nativamente. A Google descontinua versões antigas periodicamente para
 * contas novas — se um modelo passar a dar 404 "no longer available", a
 * própria resposta da API costuma dizer qual usar no lugar; adicione um
 * novo `criarGemini(...)` em CASCATA (cascata.ts) com o nome atualizado.
 */
const MIMES_SUPORTADOS = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function criarGemini(modelo: string, nomeExibicao: string): ProvedorIA {
  return {
    nome: nomeExibicao,
    mimesSuportados: MIMES_SUPORTADOS,
    async analisar(arquivo: ArquivoParaAnalise, promptSistema: string, promptUsuario: string): Promise<string> {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new ErroProvedorIA("SEM_CHAVE", nomeExibicao);
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

      let resposta: Response;
      try {
        resposta = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: promptSistema }] },
            contents: [
              {
                role: "user",
                parts: [
                  { inline_data: { mime_type: arquivo.mimeType, data: arquivo.base64 } },
                  { text: promptUsuario },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: 4096,
            },
          }),
        });
      } catch (erro) {
        throw new ErroProvedorIA("INDISPONIVEL", nomeExibicao, erro instanceof Error ? erro.message : "falha de rede");
      }

      if (!resposta.ok) {
        const corpo = await resposta.text().catch(() => "");
        if (resposta.status === 429) {
          throw new ErroProvedorIA("COTA_EXCEDIDA", nomeExibicao, corpo.slice(0, 300));
        }
        if (resposta.status === 503 || resposta.status === 502 || resposta.status === 504) {
          throw new ErroProvedorIA("INDISPONIVEL", nomeExibicao, corpo.slice(0, 300));
        }
        throw new ErroProvedorIA("ERRO", nomeExibicao, `HTTP_${resposta.status}: ${corpo.slice(0, 300)}`);
      }

      const json = await resposta.json();
      const partes = json?.candidates?.[0]?.content?.parts as Array<{ text?: string }> | undefined;
      const texto = partes?.map((p) => p.text ?? "").join("") ?? "";
      if (!texto) {
        throw new ErroProvedorIA("ERRO", nomeExibicao, "resposta vazia");
      }
      return texto;
    },
  };
}

// Ordenados do mais barato/rápido para o mais robusto — a cascata tenta
// nessa ordem antes de sair do Gemini para os outros provedores.
export const geminiFlashLite31 = criarGemini("gemini-3.1-flash-lite", "gemini-3.1-flash-lite");
export const geminiFlashLite35 = criarGemini("gemini-3.5-flash-lite", "gemini-3.5-flash-lite");
export const geminiFlash38 = criarGemini("gemini-3.8-flash", "gemini-3.8-flash");
