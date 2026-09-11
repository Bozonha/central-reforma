import { z } from "zod";

export const linhaOrcamentoSchema = z.object({
  categoria: z.string().trim().min(1, "Dê um nome para a categoria.").max(120),
  planejado: z.string().min(1, "Informe o valor planejado."),
  comprado: z.string().optional(),
  pago: z.string().optional(),
});
