import { describe, expect, it } from "vitest";
import { resumirOrcamento, type LinhaOrcamentoResumo } from "./orcamento";

const linhas: LinhaOrcamentoResumo[] = [
  { categoria: "Elétrica", planejadoCent: 500000, compradoCent: 200000, pagoCent: 150000 },
  { categoria: "Hidráulica", planejadoCent: 300000, compradoCent: 300000, pagoCent: 320000 },
];

describe("resumirOrcamento", () => {
  it("soma planejado/comprado/pago por categoria", () => {
    const resumo = resumirOrcamento(linhas);
    expect(resumo.planejadoCent).toBe(800000);
    expect(resumo.compradoCent).toBe(500000);
    expect(resumo.pagoCent).toBe(470000);
  });

  it("calcula percentuais e saldo (planejado - pago)", () => {
    const resumo = resumirOrcamento(linhas);
    expect(resumo.percentualComprado).toBe(63); // 500000/800000
    expect(resumo.percentualPago).toBe(59); // 470000/800000
    expect(resumo.saldoCent).toBe(330000);
  });

  it("marca estourado quando pago > planejado", () => {
    const estourado = resumirOrcamento([{ categoria: "X", planejadoCent: 1000, compradoCent: 1000, pagoCent: 1500 }]);
    expect(estourado.estourado).toBe(true);

    const naoEstourado = resumirOrcamento([{ categoria: "X", planejadoCent: 1000, compradoCent: 1000, pagoCent: 800 }]);
    expect(naoEstourado.estourado).toBe(false);
  });

  it("sem categorias, tudo é zero e nada estourado", () => {
    const resumo = resumirOrcamento([]);
    expect(resumo.planejadoCent).toBe(0);
    expect(resumo.estourado).toBe(false);
  });

  it("sem orçamento total da obra, os campos derivados ficam null", () => {
    const resumo = resumirOrcamento(linhas);
    expect(resumo.orcamentoTotalCent).toBeNull();
    expect(resumo.disponivelCent).toBeNull();
    expect(resumo.percentualPlanejadoDoTotal).toBeNull();
    expect(resumo.planejadoExcedeTotal).toBe(false);
  });

  it("com orçamento total, calcula disponível e percentual do total", () => {
    const resumo = resumirOrcamento(linhas, 1000000); // 10.000,00 de teto
    expect(resumo.disponivelCent).toBe(200000); // 1.000.000 - 800.000 planejado
    expect(resumo.percentualPlanejadoDoTotal).toBe(80);
    expect(resumo.planejadoExcedeTotal).toBe(false);
  });

  it("marca planejadoExcedeTotal quando a soma das categorias passa do teto da obra", () => {
    const resumo = resumirOrcamento(linhas, 500000); // teto menor que o planejado (800.000)
    expect(resumo.planejadoExcedeTotal).toBe(true);
    expect(resumo.disponivelCent).toBe(-300000);
  });
});
