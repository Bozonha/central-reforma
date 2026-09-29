import { describe, expect, it } from "vitest";
import { haversineDistanceKm, calculateTravelCost, calculateEffectiveCost, type OfferWithLogistics } from "./logistics";

describe("haversineDistanceKm", () => {
  it("distância de um ponto para ele mesmo é zero", () => {
    const p = { lat: -23.55, lng: -46.63 };
    expect(haversineDistanceKm(p, p)).toBe(0);
  });

  it("calcula uma distância real conhecida (São Paulo ↔ Rio de Janeiro, ~360km em linha reta)", () => {
    const saoPaulo = { lat: -23.5505, lng: -46.6333 };
    const rioDeJaneiro = { lat: -22.9068, lng: -43.1729 };
    const distancia = haversineDistanceKm(saoPaulo, rioDeJaneiro);
    expect(distancia).toBeGreaterThan(350);
    expect(distancia).toBeLessThan(370);
  });
});

describe("calculateTravelCost", () => {
  it("nunca inventa o custo: sem preço do combustível ou consumo, devolve o que falta", () => {
    const semNada = calculateTravelCost({
      distanceKm: 10,
      roundTrip: true,
      fuelPricePerLiter: null,
      vehicleKmPerLiter: null,
      tollCost: null,
      parkingCost: null,
      numberOfTrips: 1,
    });
    expect(semNada.effectiveTravelCost).toBeNull();
    expect(semNada.missingInputs).toContain("preço do combustível");
    expect(semNada.missingInputs).toContain("consumo do veículo (km/l)");
  });

  it("consumo do veículo igual a zero é tratado como dado inválido, não Infinity", () => {
    const resultado = calculateTravelCost({
      distanceKm: 10,
      roundTrip: false,
      fuelPricePerLiter: 6,
      vehicleKmPerLiter: 0,
      tollCost: null,
      parkingCost: null,
      numberOfTrips: 1,
    });
    expect(resultado.effectiveTravelCost).toBeNull();
    expect(resultado.missingInputs).toContain("consumo do veículo (km/l)");
  });

  it("calcula custo de combustível ida e volta, mais pedágio e estacionamento", () => {
    const resultado = calculateTravelCost({
      distanceKm: 10,
      roundTrip: true, // 20km no total
      fuelPricePerLiter: 6,
      vehicleKmPerLiter: 10, // 20km / 10km/l = 2 litros
      tollCost: 5,
      parkingCost: 3,
      numberOfTrips: 1,
    });
    // 2 litros * R$6 = R$12 de combustível + pedágio R$5 x2 (ida e volta) + R$3 estacionamento (1x, não por perna)
    expect(resultado.effectiveTravelCost).toBeCloseTo(25, 5);
    expect(resultado.missingInputs).toEqual([]);
  });

  it("multiplica pelo número de viagens (loja sem tudo em estoque)", () => {
    const umaViagem = calculateTravelCost({
      distanceKm: 10,
      roundTrip: false,
      fuelPricePerLiter: 6,
      vehicleKmPerLiter: 10,
      tollCost: null,
      parkingCost: null,
      numberOfTrips: 1,
    });
    const duasViagens = calculateTravelCost({
      distanceKm: 10,
      roundTrip: false,
      fuelPricePerLiter: 6,
      vehicleKmPerLiter: 10,
      tollCost: null,
      parkingCost: null,
      numberOfTrips: 2,
    });
    expect(duasViagens.effectiveTravelCost).toBeCloseTo((umaViagem.effectiveTravelCost ?? 0) * 2, 5);
  });
});

describe("calculateEffectiveCost", () => {
  it("oferta com entrega usa o frete, nunca custo de deslocamento", () => {
    const oferta: OfferWithLogistics = {
      sellerName: "Loja Entrega",
      productPrice: 100,
      isLocalPickup: false,
      shippingCost: 15,
      distanceKm: null,
      travelCost: null,
    };
    const resultado = calculateEffectiveCost(oferta, null);
    expect(resultado.effectiveCost).toBe(115);
    expect(resultado.breakdown.travelCost).toBe(0);
    expect(resultado.isViable).toBe(true);
  });

  it("oferta de retirada local sem dados de deslocamento não é calculável", () => {
    const oferta: OfferWithLogistics = {
      sellerName: "Loja Local",
      productPrice: 100,
      isLocalPickup: true,
      shippingCost: null,
      distanceKm: 10,
      travelCost: { effectiveTravelCost: null, missingInputs: ["preço do combustível"] },
    };
    const resultado = calculateEffectiveCost(oferta, null);
    expect(resultado.effectiveCost).toBeNull();
    expect(resultado.isViable).toBe(false);
    expect(resultado.reason).toContain("preço do combustível");
  });

  it("marca inviável quando o custo efetivo ultrapassa o teto informado", () => {
    const oferta: OfferWithLogistics = {
      sellerName: "Loja Cara",
      productPrice: 100,
      isLocalPickup: false,
      shippingCost: 50,
      distanceKm: null,
      travelCost: null,
    };
    const resultado = calculateEffectiveCost(oferta, 120);
    expect(resultado.effectiveCost).toBe(150);
    expect(resultado.isViable).toBe(false);
  });

  it("sem teto informado, qualquer custo efetivo é viável", () => {
    const oferta: OfferWithLogistics = {
      sellerName: "Loja Qualquer",
      productPrice: 1000,
      isLocalPickup: false,
      shippingCost: 0,
      distanceKm: null,
      travelCost: null,
    };
    const resultado = calculateEffectiveCost(oferta, null);
    expect(resultado.isViable).toBe(true);
  });
});
