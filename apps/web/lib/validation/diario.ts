import { z } from "zod";

export const entradaDiarioSchema = z.object({
  texto: z.string().trim().min(1, "Escreva algo sobre o dia.").max(4000),
  data: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
