/**
 * Geocodificação de endereço via Nominatim (OpenStreetMap) — decisão B.9
 * (docs/product/decisao-fontes-de-mercado.md): serviço gratuito, sem chave de
 * API, mas com uso obrigatório de um User-Agent identificável (política de
 * uso do Nominatim) e limite de ~1 requisição/segundo por cliente.
 *
 * Esta chamada acontece em tempo de execução no servidor de produção
 * (Vercel) e depende de acesso de rede de saída — não é feita durante o
 * build. Se a rede falhar ou não houver resultado, retorna `null`: seguindo
 * a regra 1 do projeto, nunca inventamos uma coordenada.
 */

export interface ResultadoGeocodificacao {
  latitude: number;
  longitude: number;
  enderecoExibicao: string;
}

function userAgent(): string {
  return process.env.NOMINATIM_USER_AGENT || "central-de-reforma-app (contato-nao-configurado)";
}

export async function geocodificarEndereco(endereco: string): Promise<ResultadoGeocodificacao | null> {
  if (!endereco.trim()) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", endereco);
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");

    const res = await fetch(url, {
      headers: { "User-Agent": userAgent(), "Accept-Language": "pt-BR" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;

    const dados = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    const primeiro = dados[0];
    if (!primeiro) return null;

    const latitude = Number(primeiro.lat);
    const longitude = Number(primeiro.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

    return { latitude, longitude, enderecoExibicao: primeiro.display_name };
  } catch {
    // Rede indisponível, timeout, ou host bloqueado — não é um dado inventável.
    return null;
  }
}
