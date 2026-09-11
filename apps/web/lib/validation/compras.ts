import { z } from "zod";

export const itemListaSchema = z.object({
  nomeLivre: z.string().trim().min(1, "Dê um nome para o item.").max(160),
  quantidadeNecessaria: z.string().min(1, "Informe a quantidade."),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA"]).default("MEDIA"),
  etapa: z.string().trim().max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export const compraSchema = z.object({
  nomeLivre: z.string().trim().min(1, "Dê um nome para a compra.").max(160),
  produtoId: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  lojaId: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  quantidade: z.string().min(1, "Informe a quantidade."),
  precoUnitario: z.string().min(1, "Informe o preço unitário."),
  formaPagamento: z.string().trim().max(60).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  data: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});
