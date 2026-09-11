/**
 * Ponte entre o catálogo de ofertas (produtos/lojas cadastrados manualmente,
 * ver lib/mercado/actions.ts) e o motor de logística determinístico de
 * packages/domain/src/logistics.ts. Nenhuma regra de cálculo mora aqui —
 * apenas conversão de centavos (convenção de dinheiro do projeto, CLAUDE.md
 * #3) para os "reais" em ponto flutuante que as funções de domínio recebem.
 *
 * Regra que este módulo protege: uma oferta só entra no ranking por custo
 * efetivo quando dá para calcular esse custo com dado real. Faltando frete
 * (loja online) ou localização/perfil de deslocamento (loja física), o
 * resultado diz exatamente o que falta — nunca assume R$ 0 (CLAUDE.md #1).
 */
import {
  calculateEffectiveCost,
  calculateTravelCost,
  haversineDistanceKm,
  type GeoPoint,
  type OfferWithLogistics,
} from "@central-reforma/domain";

export interface ObraLogisticaPerfil {
  combustivelPrecoLitroCent: number | null;
  veiculoKmPorLitro: number | null;
  pedagioCent: number | null;
  estacionamentoCent: number | null;
}

export interface OfertaParaCusto {
  precoCent: number;
  freteCent: number | null;
  lojaTipo: "ONLINE" | "FISICA";
  lojaCoord: GeoPoint | null;
}

export interface CustoEfetivoResultado {
  effectiveCostCent: number | null;
  distanceKm: number | null;
  deslocamentoCent: number | null;
  nota: string;
}

export function calcularCustoEfetivo(
  oferta: OfertaParaCusto,
  obraCoord: GeoPoint | null,
  perfil: ObraLogisticaPerfil,
): CustoEfetivoResultado {
  if (oferta.lojaTipo === "ONLINE") {
    if (oferta.freteCent == null) {
      return {
        effectiveCostCent: null,
        distanceKm: null,
        deslocamentoCent: null,
        nota: "Frete não informado.",
      };
    }
    return {
      effectiveCostCent: oferta.precoCent + oferta.freteCent,
      distanceKm: null,
      deslocamentoCent: null,
      nota: oferta.freteCent === 0 ? "Frete grátis informado." : "Preço + frete informado.",
    };
  }

  // Retirada em loja física: custo efetivo = preço + deslocamento (nunca frete).
  if (!obraCoord || !oferta.lojaCoord) {
    return {
      effectiveCostCent: null,
      distanceKm: null,
      deslocamentoCent: null,
      nota: "Geocodifique a obra e a loja para calcular o deslocamento (aba Lojas próximas).",
    };
  }

  const distanceKm = haversineDistanceKm(obraCoord, oferta.lojaCoord);
  const travelCost = calculateTravelCost({
    distanceKm,
    roundTrip: true,
    fuelPricePerLiter: perfil.combustivelPrecoLitroCent != null ? perfil.combustivelPrecoLitroCent / 100 : null,
    vehicleKmPerLiter: perfil.veiculoKmPorLitro,
    tollCost: perfil.pedagioCent != null ? perfil.pedagioCent / 100 : null,
    parkingCost: perfil.estacionamentoCent != null ? perfil.estacionamentoCent / 100 : null,
    numberOfTrips: 1,
  });

  const offer: OfferWithLogistics = {
    sellerName: "",
    productPrice: oferta.precoCent / 100,
    isLocalPickup: true,
    shippingCost: null,
    distanceKm,
    travelCost,
  };

  const resultado = calculateEffectiveCost(offer, null);

  if (resultado.effectiveCost == null) {
    return {
      effectiveCostCent: null,
      distanceKm,
      deslocamentoCent: null,
      nota: `${distanceKm.toFixed(1)} km até a loja — falta informar ${travelCost.missingInputs.join(" e ")} para calcular o deslocamento.`,
    };
  }

  return {
    effectiveCostCent: Math.round(resultado.effectiveCost * 100),
    distanceKm,
    deslocamentoCent: Math.round(resultado.breakdown.travelCost * 100),
    nota: `${distanceKm.toFixed(1)} km até a loja (ida e volta).`,
  };
}
