import { describe, expect, it } from "vitest";
import { centsToBRL, parseBRLToCents, reaisToCents, sumCents, percentOf } from "./money";

describe("reaisToCents", () => {
  it("converte reais para centavos inteiros", () => {
    expect(reaisToCents(10)).toBe(1000);
    expect(reaisToCents(10.5)).toBe(1050);
  });

  it("arredonda em vez de truncar (evita erro de ponto flutuante)", () => {
    // 3 parcelas de 33,33... não pode virar 3332 por truncamento de float.
    expect(reaisToCents(19.99)).toBe(1999);
    expect(reaisToCents(0.1 + 0.2)).toBe(30);
  });
});

describe("centsToBRL", () => {
  it("formata centavos como moeda brasileira", () => {
    expect(centsToBRL(150000)).toBe((1500).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  });

  it("formata zero e negativos", () => {
    expect(centsToBRL(0)).toContain("0,00");
    expect(centsToBRL(-500)).toContain("-");
  });
});

describe("parseBRLToCents", () => {
  it("aceita formato brasileiro com milhar e decimal", () => {
    expect(parseBRLToCents("1.234,56")).toBe(123456);
    expect(parseBRLToCents("30.000,00")).toBe(3000000);
  });

  it("aceita formato simples sem milhar", () => {
    expect(parseBRLToCents("1234,56")).toBe(123456);
    expect(parseBRLToCents("1234.56")).toBe(123456);
  });

  it("devolve null para entrada vazia ou inválida — nunca inventa um valor", () => {
    expect(parseBRLToCents("")).toBeNull();
    expect(parseBRLToCents("   ")).toBeNull();
    expect(parseBRLToCents("abc")).toBeNull();
  });
});

describe("sumCents", () => {
  it("soma uma lista de centavos", () => {
    expect(sumCents([100, 200, 300])).toBe(600);
  });

  it("trata null/undefined como zero em vez de quebrar a soma", () => {
    expect(sumCents([100, null, undefined, 200])).toBe(300);
  });

  it("soma vazia é zero", () => {
    expect(sumCents([])).toBe(0);
  });
});

describe("percentOf", () => {
  it("calcula percentual arredondado", () => {
    expect(percentOf(50, 200)).toBe(25);
    expect(percentOf(1, 3)).toBe(33);
  });

  it("total zero ou negativo devolve 0 em vez de Infinity/NaN", () => {
    expect(percentOf(50, 0)).toBe(0);
    expect(percentOf(50, -10)).toBe(0);
  });
});
