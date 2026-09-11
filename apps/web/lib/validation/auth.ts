import { z } from "zod";

export const registroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  senha: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  senha: z.string().min(1, "Informe sua senha."),
});

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
