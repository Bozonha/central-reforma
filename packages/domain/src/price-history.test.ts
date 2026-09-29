import { describe, expect, it } from "vitest";
import { classificarPreco, MIN_OBSERVACOES_PARA_CLASSIFICAR, JANELA_DIAS_HISTORICO } from "./price-history";

const AGORA = new Date("2026-06-15T12:00:00Z");

function diasAtras(dias: number): Date {
  return new Date(AGORA.getTime() - dias * 24 * 60 * 60 * 1000);
}

describe("classificarPreco", () => {
  it("classifica CINZA quando há menos observações que o mínimo na janela", () => {
    const historico = Array.from({ length: MIN_OBSERVACOES_PARA_CLASSIFICAR - 1 }, (_, i) => ({
      precoCent: 1000 + i,
      capturadoEm: diasAtras(1),
    }));
    const resultado = classificarPreco(1000, historico, AGORA);
    expect(resultado.classificacao).toBe("CINZA");
    expect(resultado.percentil25Cent).toBeNull();
    expect(resultado.percentil75Cent).toBeNull();
  });

  it("ignora observações fora da janela de dias ao contar o mínimo", () => {
    const historico = [
      { precoCent: 1000, capturadoEm: diasAtras(1) },
      { precoCent: 1000, capturadoEm: diasAtras(2) },
      // Fora da janela — não deve contar para o mínimo.
      { precoCent: 1000, capturadoEm: diasAtras(JANELA_DIAS_HISTORICO + 10) },
    ];
    const resultado = classificarPreco(1000, historico, AGORA);
    expect(resultado.classificacao).toBe("CINZA");
    expect(resultado.observacoesConsideradas).toBe(2);
  });

  it("classifica VERDE quando o preço está no percentil 25 ou abaixo", () => {
    const historico = [100, 200, 300, 400, 500].map((precoCent) => ({ precoCent: precoCent * 100, capturadoEm: diasAtras(1) }));
    const resultado = classificarPreco(10000, historico, AGORA); // 100,00 — o mais barato
    expect(resultado.classificacao).toBe("VERDE");
  });

  it("classifica VERMELHO quando o preço está acima do percentil 75", () => {
    const historico = [100, 200, 300, 400, 500].map((precoCent) => ({ precoCent: precoCent * 100, capturadoEm: diasAtras(1) }));
    const resultado = classificarPreco(50000, historico, AGORA); // 500,00 — o mais caro
    expect(resultado.classificacao).toBe("VERMELHO");
  });

  it("classifica AMARELO quando o preço está na faixa intermediária", () => {
    const historico = [100, 200, 300, 400, 500].map((precoCent) => ({ precoCent: precoCent * 100, capturadoEm: diasAtras(1) }));
    const resultado = classificarPreco(30000, historico, AGORA); // 300,00 — mediana
    expect(resultado.classificacao).toBe("AMARELO");
  });
});
