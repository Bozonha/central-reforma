/**
 * Motor de logística — promovido do spike original
 * (docs/agents/market-engine-spike/distance-cost.ts) para código de
 * produção sem alterações de lógica. Determinístico (sem LLM, CLAUDE.md
 * #3): a busca de material não se limita a marketplaces — inclui pequenas
 * lojas locais, e a distância até elas é um CUSTO que pode tornar uma
 * oferta mais barata, na prática, inviável (seção 16 do escopo mestre:
 * custo do produto + frete + combustível + pedágio + estacionamento =
 * custo efetivo).
 */

// ---------------------------------------------------------------------------
// 1. Descoberta de lojas locais — interface plugável
// ---------------------------------------------------------------------------

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type StoreDiscoveryMethod = "google_places" | "openstreetmap_overpass" | "user_submitted";

export interface LocalStoreCandidate {
  name: string;
  address: string;
  location: GeoPoint;
  category: string; // ex.: "loja de materiais de construção", "depósito", "ferragem"
  discoveryMethod: StoreDiscoveryMethod;
  sourceRef: string; // place_id do Google, ou id do nó OSM, ou id do envio do usuário
  hasKnownWebsite: boolean;
  phone?: string;
}

/**
 * A maioria das lojas locais pequenas não tem site, API nem presença
 * estruturada — a forma REAL de conseguir preço delas, na prática, é:
 *   1. o próprio usuário cadastrar manualmente ("fui lá, custava X");
 *   2. o usuário enviar foto de etiqueta de preço/nota fiscal (OCR, seção 21/26);
 *   3. eventualmente, o dono da loja confirmar disponibilidade/preço quando
 *      contatado (fora do escopo do MVP 1).
 * Ou seja: para lojas locais, o gargalo NÃO é técnico de scraping — é de
 * cadastro. A descoberta (esta interface) só resolve "quais lojas existem
 * perto", não "quanto elas cobram".
 */
export interface LocalStoreDiscovery {
  readonly method: StoreDiscoveryMethod;
  findNearby(center: GeoPoint, radiusKm: number, category: string): Promise<LocalStoreCandidate[]>;
}

// ---------------------------------------------------------------------------
// 2. Distância e custo de deslocamento (determinístico)
// ---------------------------------------------------------------------------

export interface DistanceResult {
  distanceKm: number;
  estimatedTravelMinutes: number;
  source: "routing_api" | "haversine_fallback";
}

/** Fallback determinístico quando não há API de rota disponível: linha reta. */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export interface TravelCostInputs {
  distanceKm: number;
  roundTrip: boolean; // ida e volta, se o usuário for buscar
  fuelPricePerLiter: number | null; // informado pelo usuário — nunca inventado
  vehicleKmPerLiter: number | null; // informado pelo usuário
  tollCost: number | null; // informado pelo usuário/estimado por API de rota
  parkingCost: number | null;
  numberOfTrips: number; // pode ser >1 se a loja não tiver tudo em estoque
}

export interface TravelCostResult {
  effectiveTravelCost: number | null;
  missingInputs: string[]; // quais dados faltaram para o cálculo — nunca "chutado"
}

/**
 * Espelha a regra da seção 16: nunca inventar custo. Se faltar um
 * componente necessário, o resultado explicita o que falta em vez de
 * assumir um valor.
 */
export function calculateTravelCost(inputs: TravelCostInputs): TravelCostResult {
  const missing: string[] = [];
  if (inputs.fuelPricePerLiter == null) missing.push("preço do combustível");
  if (inputs.vehicleKmPerLiter == null) missing.push("consumo do veículo (km/l)");

  if (missing.length > 0) {
    return { effectiveTravelCost: null, missingInputs: missing };
  }

  const legs = inputs.roundTrip ? 2 : 1;
  const totalKm = inputs.distanceKm * legs * inputs.numberOfTrips;
  const fuelCost = (totalKm / (inputs.vehicleKmPerLiter as number)) * (inputs.fuelPricePerLiter as number);
  const tolls = (inputs.tollCost ?? 0) * legs * inputs.numberOfTrips;
  const parking = (inputs.parkingCost ?? 0) * inputs.numberOfTrips;

  return { effectiveTravelCost: fuelCost + tolls + parking, missingInputs: [] };
}

// ---------------------------------------------------------------------------
// 3. Custo efetivo total de uma oferta (preço do produto + deslocamento)
// ---------------------------------------------------------------------------

export interface OfferWithLogistics {
  sellerName: string;
  productPrice: number;
  isLocalPickup: boolean; // exige deslocamento do usuário até a loja
  shippingCost: number | null; // caso a loja entregue
  distanceKm: number | null; // caso seja retirada local
  travelCost: TravelCostResult | null;
}

export interface EffectiveCostResult {
  sellerName: string;
  effectiveCost: number | null;
  breakdown: {
    productPrice: number;
    shippingCost: number;
    travelCost: number;
  };
  isViable: boolean; // false quando o custo de deslocamento supera um limiar configurável
  reason: string;
}

/**
 * "A melhor oferta não é necessariamente a de menor preço anunciado"
 * (seção 15). Aqui isso vira uma função pura e testável: uma loja mais
 * longe só é considerada inviável quando o custo efetivo (preço + logística)
 * ultrapassa o de uma alternativa mais próxima — nunca por causa de uma
 * "impressão" da IA sobre distância.
 */
export function calculateEffectiveCost(
  offer: OfferWithLogistics,
  viabilityCeiling: number | null // ex.: orçamento máximo daquele item da lista de compras
): EffectiveCostResult {
  if (offer.isLocalPickup && offer.travelCost?.missingInputs.length) {
    return {
      sellerName: offer.sellerName,
      effectiveCost: null,
      breakdown: { productPrice: offer.productPrice, shippingCost: 0, travelCost: 0 },
      isViable: false,
      reason: `Não foi possível calcular o custo total porque faltam: ${offer.travelCost.missingInputs.join(", ")}.`,
    };
  }

  const travelCost = offer.isLocalPickup ? offer.travelCost?.effectiveTravelCost ?? 0 : 0;
  const shippingCost = offer.isLocalPickup ? 0 : offer.shippingCost ?? 0;
  const effectiveCost = offer.productPrice + shippingCost + travelCost;

  const isViable = viabilityCeiling == null ? true : effectiveCost <= viabilityCeiling;

  return {
    sellerName: offer.sellerName,
    effectiveCost,
    breakdown: { productPrice: offer.productPrice, shippingCost, travelCost },
    isViable,
    reason: isViable
      ? "Dentro do custo efetivo aceitável."
      : `Custo efetivo (R$ ${effectiveCost.toFixed(2)}) ultrapassa o limite considerado viável.`,
  };
}
