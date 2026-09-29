import { describe, expect, it } from "vitest";
import { gerarAlertas, type GerarAlertasInput } from "./alertas";

const AGORA = new Date("2026-06-15T12:00:00Z");

function baseInput(overrides: Partial<GerarAlertasInput> = {}): GerarAlertasInput {
  return {
    linhas: [],
    tarefas: [],
    itensLista: [],
    obraNomePorId: new Map(),
    mostrarNomeObra: false,
    agora: AGORA,
    ...overrides,
  };
}

describe("gerarAlertas — orçamento", () => {
  it("não alerta quando o gasto está abaixo de 80% do planejado", () => {
    const alertas = gerarAlertas(
      baseInput({ linhas: [{ obraId: "o1", categoria: "Elétrica", planejadoCent: 1000, compradoCent: 700 }] }),
    );
    expect(alertas).toHaveLength(0);
  });

  it("alerta nível médio entre 80% e 99%", () => {
    const alertas = gerarAlertas(
      baseInput({ linhas: [{ obraId: "o1", categoria: "Elétrica", planejadoCent: 1000, compradoCent: 850 }] }),
    );
    expect(alertas).toHaveLength(1);
    expect(alertas[0]?.nivel).toBe("medio");
    expect(alertas[0]?.texto).toContain("Elétrica");
  });

  it("alerta nível alto a partir de 100%", () => {
    const alertas = gerarAlertas(
      baseInput({ linhas: [{ obraId: "o1", categoria: "Elétrica", planejadoCent: 1000, compradoCent: 1200 }] }),
    );
    expect(alertas[0]?.nivel).toBe("alto");
  });

  it("ignora categoria sem planejado (planejadoCent <= 0) — nunca divide por zero", () => {
    const alertas = gerarAlertas(baseInput({ linhas: [{ obraId: "o1", categoria: "X", planejadoCent: 0, compradoCent: 500 }] }));
    expect(alertas).toHaveLength(0);
  });

  it("inclui o nome da obra no texto só quando mostrarNomeObra é true", () => {
    const linha = { obraId: "o1", categoria: "Elétrica", planejadoCent: 1000, compradoCent: 1200 };
    const semNome = gerarAlertas(baseInput({ linhas: [linha] }));
    expect(semNome[0]?.texto).not.toContain("Obra A");

    const comNome = gerarAlertas(
      baseInput({ linhas: [linha], mostrarNomeObra: true, obraNomePorId: new Map([["o1", "Obra A"]]) }),
    );
    expect(comNome[0]?.texto).toContain("Obra A");
  });
});

describe("gerarAlertas — tarefas atrasadas", () => {
  it("alerta tarefa não concluída com prazo no passado", () => {
    const alertas = gerarAlertas(
      baseInput({
        tarefas: [{ obraId: "o1", titulo: "Instalar piso", status: "EM_ANDAMENTO", fim: new Date("2026-06-01") }],
      }),
    );
    expect(alertas).toHaveLength(1);
    expect(alertas[0]?.nivel).toBe("alto");
    expect(alertas[0]?.texto).toContain("Instalar piso");
  });

  it("não alerta tarefa concluída mesmo com prazo no passado", () => {
    const alertas = gerarAlertas(
      baseInput({ tarefas: [{ obraId: "o1", titulo: "Instalar piso", status: "CONCLUIDA", fim: new Date("2026-06-01") }] }),
    );
    expect(alertas).toHaveLength(0);
  });

  it("não alerta tarefa sem prazo definido", () => {
    const alertas = gerarAlertas(baseInput({ tarefas: [{ obraId: "o1", titulo: "Instalar piso", status: "PENDENTE", fim: null }] }));
    expect(alertas).toHaveLength(0);
  });

  it("não alerta tarefa com prazo no futuro", () => {
    const alertas = gerarAlertas(
      baseInput({ tarefas: [{ obraId: "o1", titulo: "Instalar piso", status: "PENDENTE", fim: new Date("2026-07-01") }] }),
    );
    expect(alertas).toHaveLength(0);
  });
});

describe("gerarAlertas — itens de lista parados", () => {
  it("alerta quando há itens pendentes criados há mais de 5 dias", () => {
    const alertas = gerarAlertas(
      baseInput({
        itensLista: [
          { obraId: "o1", status: "PENDENTE", criadoEm: new Date("2026-06-01") },
          { obraId: "o1", status: "PENDENTE", criadoEm: new Date("2026-06-02") },
        ],
      }),
    );
    expect(alertas).toHaveLength(1);
    expect(alertas[0]?.texto).toContain("2 itens");
    expect(alertas[0]?.nivel).toBe("medio");
  });

  it("ignora itens já comprados/cancelados e itens recentes", () => {
    const alertas = gerarAlertas(
      baseInput({
        itensLista: [
          { obraId: "o1", status: "COMPRADO", criadoEm: new Date("2026-06-01") },
          { obraId: "o1", status: "PENDENTE", criadoEm: new Date("2026-06-14") },
        ],
      }),
    );
    expect(alertas).toHaveLength(0);
  });

  it("usa singular para um único item pendente", () => {
    const alertas = gerarAlertas(baseInput({ itensLista: [{ obraId: "o1", status: "PENDENTE", criadoEm: new Date("2026-06-01") }] }));
    expect(alertas[0]?.texto).toContain("1 item está pendente");
  });
});

describe("gerarAlertas — ordenação", () => {
  it("coloca alertas de nível alto antes dos de nível médio", () => {
    const alertas = gerarAlertas(
      baseInput({
        linhas: [{ obraId: "o1", categoria: "Elétrica", planejadoCent: 1000, compradoCent: 850 }],
        tarefas: [{ obraId: "o1", titulo: "Instalar piso", status: "PENDENTE", fim: new Date("2026-06-01") }],
      }),
    );
    expect(alertas[0]?.nivel).toBe("alto");
    expect(alertas[1]?.nivel).toBe("medio");
  });
});
