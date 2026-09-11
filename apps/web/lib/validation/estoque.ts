import { z } from "zod";

export const itemEstoqueSchema = z.object({
  nomeLivre: z.string().trim().min(1, "Dê um nome para o item.").max(160),
  quantidade: z.string().min(1, "Informe a quantidade."),
  unidade: z.string().trim().min(1, "Informe a unidade.").max(40),
});
