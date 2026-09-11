/**
 * Descoberta de lojas físicas próximas via Overpass API (OpenStreetMap) —
 * decisão B.9. Sem chave de API, dado real com proveniência (fonte="OSM",
 * fonteId = id do node no OSM). Nunca inventa lojas: se a API falhar ou não
 * houver resultado, retorna lista vazia e a UI mostra "nenhuma loja
 * encontrada", nunca dados fictícios (regra 1 do projeto).
 *
 * Consulta node/way com tags shop relevantes para material de construção
 * dentro de um raio (metros) do ponto informado.
 */

export interface LojaDescoberta {
  osmId: string;
  nome: string;
  categoria: string | null;
  latitude: number;
  longitude: number;
  enderecoAproximado: string | null;
}

const TAGS_LOJA_CONSTRUCAO = [
  "shop=hardware",
  "shop=doityourself",
  "shop=trade",
  "shop=paint",
  "shop=tiles",
  "shop=electrical",
  "shop=bathroom_furnishing",
  "shop=houseware",
  "shop=building_materials",
];

function montarQuery(lat: number, lon: number, raioMetros: number): string {
  const filtros = TAGS_LOJA_CONSTRUCAO.map((tag) => {
    const [chave, valor] = tag.split("=");
    return `node["${chave}"="${valor}"](around:${raioMetros},${lat},${lon});way["${chave}"="${valor}"](around:${raioMetros},${lat},${lon});`;
  }).join("\n  ");

  return `[out:json][timeout:15];
(
  ${filtros}
);
out center 40;`;
}

function montarEndereco(tags: Record<string, string>): string | null {
  const partes = [tags["addr:street"], tags["addr:housenumber"], tags["addr:suburb"] || tags["addr:city"]].filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : null;
}

export async function buscarLojasProximas(lat: number, lon: number, raioMetros = 3000): Promise<LojaDescoberta[]> {
  try {
    const query = montarQuery(lat, lon, raioMetros);
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return [];

    const dados = (await res.json()) as {
      elements: {
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }[];
    };

    const resultados: LojaDescoberta[] = [];
    for (const el of dados.elements) {
      const tags = el.tags ?? {};
      const nome = tags.name;
      if (!nome) continue;
      const latitude = el.lat ?? el.center?.lat;
      const longitude = el.lon ?? el.center?.lon;
      if (latitude === undefined || longitude === undefined) continue;

      resultados.push({
        osmId: `${el.type}/${el.id}`,
        nome,
        categoria: tags.shop ?? null,
        latitude,
        longitude,
        enderecoAproximado: montarEndereco(tags),
      });
    }
    return resultados;
  } catch {
    return [];
  }
}
