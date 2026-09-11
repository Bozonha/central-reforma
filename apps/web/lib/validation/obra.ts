import { z } from "zod";

export const obraSchema = z.object({
  nome: z.string().trim().min(2, "Dê um nome para a obra.").max(120),
  tipo: z.enum(["CASA", "APARTAMENTO", "AMBIENTE_UNICO", "OUTRO"]),
  orcamentoTotal: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFimPrevista: z.string().optional(),
  observacoes: z.string().max(2000).optional(),
  logradouro: z.string().max(200).optional(),
  cidade: z.string().max(120).optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().max(12).optional(),
});

export const ambienteSchema = z.object({
  nome: z.string().trim().min(1, "Dê um nome para o ambiente.").max(120),
  largura: z.string().optional(),
  comprimento: z.string().optional(),
  altura: z.string().optional(),
  observacoes: z.string().max(2000).optional(),
});

export const colaboradorSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  papel: z.enum(["COLABORADOR", "VISUALIZADOR"]),
});

/**
 * Perfil de deslocamento da obra (packages/domain/src/logistics.ts) — usado
 * para calcular o custo efetivo de ofertas com retirada local. Todos os
 * campos são opcionais: sem eles, o cálculo de deslocamento simplesmente diz
 * o que falta em vez de assumir um valor (CLAUDE.md #1).
 */
export const logisticaSchema = z.object({
  combustivelPrecoLitro: z.string().optional(),
  veiculoKmPorLitro: z.string().optional(),
  pedagio: z.string().optional(),
  estacionamento: z.string().optional(),
});
