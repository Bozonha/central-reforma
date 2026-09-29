import { describe, expect, it } from "vitest";
import { areaAmbiente, volumeAmbiente, labelFonteMedida } from "./area";

describe("areaAmbiente", () => {
  it("calcula largura × comprimento arredondado a 2 casas", () => {
    // Caso verificado ao vivo em produção durante o teste de usabilidade
    // (relatório de auditoria): 4,5m × 5,2m → 23,40 m².
    expect(areaAmbiente(4.5, 5.2)).toBe(23.4);
  });

  it("devolve null quando falta uma das medidas — nunca estima", () => {
    expect(areaAmbiente(null, 5)).toBeNull();
    expect(areaAmbiente(5, null)).toBeNull();
    expect(areaAmbiente(null, null)).toBeNull();
  });

  it("devolve null para medidas zero ou negativas (dado inválido, não área zero)", () => {
    expect(areaAmbiente(0, 5)).toBeNull();
    expect(areaAmbiente(-2, 5)).toBeNull();
  });
});

describe("volumeAmbiente", () => {
  it("calcula área × altura", () => {
    expect(volumeAmbiente(2, 3, 2.8)).toBe(16.8);
  });

  it("devolve null se a área não puder ser calculada", () => {
    expect(volumeAmbiente(null, 3, 2.8)).toBeNull();
  });

  it("devolve null se faltar altura", () => {
    expect(volumeAmbiente(2, 3, null)).toBeNull();
  });
});

describe("labelFonteMedida", () => {
  it("tem um rótulo para toda proveniência de medida", () => {
    expect(labelFonteMedida("USUARIO")).toBe("Informado por você");
    expect(labelFonteMedida("DOCUMENTO")).toBe("Extraído de documento");
    expect(labelFonteMedida("VISAO_ESTIMADA")).toBe("Estimado por IA (visão)");
    expect(labelFonteMedida("CONFIRMADA")).toBe("Confirmado");
    expect(labelFonteMedida("DESCONHECIDA")).toBe("Desconhecido");
  });
});
