import { z } from "zod";

export const produtoSchema = z.object({
  nome: z.string().trim().min(1, "Dê um nome para o produto.").max(160),
  categoria: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  marca: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  modelo: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  unidade: z.string().trim().min(1, "Informe a unidade.").max(40),
});

export const lojaManualSchema = z.object({
  nome: z.string().trim().min(1, "Dê um nome para a loja.").max(160),
  tipo: z.enum(["ONLINE", "FISICA"]),
  logradouro: z.string().trim().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  cidade: z.string().trim().max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  estado: z.string().trim().max(2).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  cep: z.string().trim().max(9).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export const ofertaSchema = z.object({
  produtoId: z.string().trim().min(1, "Selecione um produto."),
  lojaId: z.string().trim().min(1, "Selecione uma loja."),
  preco: z.string().min(1, "Informe o preço."),
  unidade: z.string().trim().min(1, "Informe a unidade.").max(40),
  frete: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  fonteUrl: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});
