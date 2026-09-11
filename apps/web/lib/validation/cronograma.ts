import { z } from "zod";

export const tarefaSchema = z.object({
  titulo: z.string().trim().min(1, "Dê um título para a tarefa.").max(160),
  responsavel: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  inicio: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  fim: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA"]).default("MEDIA"),
});
