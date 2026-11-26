import { z } from "zod";

export const cadastroSimplesSchema = z.object({
  nome: z.string().min(2, { error: "Nome muito curto" }),
  email: z.email({ error: "E-mail inválido" }),
  senha: z.string().min(6, { error: "Senha precisa ter pelo menos 6 caracteres" }),
  telefone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email({ error: "E-mail inválido" }),
  senha: z.string().min(1, { error: "Senha é obrigatória" }),
  tipo: z.enum(["CLIENTE", "BARBEIRO"]),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, { error: "idToken é obrigatório" }),
});