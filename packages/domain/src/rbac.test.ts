import { describe, expect, it } from "vitest";
import {
  alteracaoDeixariaSemSuperAdmin,
  labelPapelConta,
  nivelPapelConta,
  podeAcessarPainelAdmin,
  podeAlterarPapelDeConta,
  podeCriarContaComPapel,
} from "./rbac";

describe("nivelPapelConta", () => {
  it("ordena USUARIO < ADMIN < SUPERADMIN", () => {
    expect(nivelPapelConta("USUARIO")).toBeLessThan(nivelPapelConta("ADMIN"));
    expect(nivelPapelConta("ADMIN")).toBeLessThan(nivelPapelConta("SUPERADMIN"));
  });
});

describe("labelPapelConta", () => {
  it("traduz os três papéis", () => {
    expect(labelPapelConta("SUPERADMIN")).toBe("Super admin");
    expect(labelPapelConta("ADMIN")).toBe("Admin");
    expect(labelPapelConta("USUARIO")).toBe("Usuário");
  });
});

describe("podeAcessarPainelAdmin", () => {
  it("permite SUPERADMIN e ADMIN", () => {
    expect(podeAcessarPainelAdmin("SUPERADMIN")).toBe(true);
    expect(podeAcessarPainelAdmin("ADMIN")).toBe(true);
  });

  it("bloqueia USUARIO", () => {
    expect(podeAcessarPainelAdmin("USUARIO")).toBe(false);
  });
});

describe("podeCriarContaComPapel", () => {
  it("SUPERADMIN pode criar qualquer papel, incluindo outro SUPERADMIN", () => {
    expect(podeCriarContaComPapel("SUPERADMIN", "SUPERADMIN")).toBe(true);
    expect(podeCriarContaComPapel("SUPERADMIN", "ADMIN")).toBe(true);
    expect(podeCriarContaComPapel("SUPERADMIN", "USUARIO")).toBe(true);
  });

  it("ADMIN só pode criar conta USUARIO", () => {
    expect(podeCriarContaComPapel("ADMIN", "USUARIO")).toBe(true);
    expect(podeCriarContaComPapel("ADMIN", "ADMIN")).toBe(false);
    expect(podeCriarContaComPapel("ADMIN", "SUPERADMIN")).toBe(false);
  });

  it("USUARIO não pode criar conta nenhuma", () => {
    expect(podeCriarContaComPapel("USUARIO", "USUARIO")).toBe(false);
    expect(podeCriarContaComPapel("USUARIO", "ADMIN")).toBe(false);
  });
});

describe("podeAlterarPapelDeConta", () => {
  it("só SUPERADMIN altera papel de conta existente", () => {
    expect(podeAlterarPapelDeConta("SUPERADMIN")).toBe(true);
    expect(podeAlterarPapelDeConta("ADMIN")).toBe(false);
    expect(podeAlterarPapelDeConta("USUARIO")).toBe(false);
  });
});

describe("alteracaoDeixariaSemSuperAdmin", () => {
  it("bloqueia rebaixar o único SUPERADMIN restante", () => {
    expect(alteracaoDeixariaSemSuperAdmin("SUPERADMIN", "ADMIN", 1)).toBe(true);
  });

  it("permite rebaixar um SUPERADMIN quando há outros", () => {
    expect(alteracaoDeixariaSemSuperAdmin("SUPERADMIN", "ADMIN", 2)).toBe(false);
  });

  it("não se aplica a quem não é SUPERADMIN", () => {
    expect(alteracaoDeixariaSemSuperAdmin("ADMIN", "USUARIO", 1)).toBe(false);
  });

  it("não bloqueia quando o novo papel continua SUPERADMIN", () => {
    expect(alteracaoDeixariaSemSuperAdmin("SUPERADMIN", "SUPERADMIN", 1)).toBe(false);
  });
});
