import { z } from "zod";

export const criarBarbeiroSchema = z.object({
  nome: z.string().min(2, { error: "Nome muito curto" }),
  nomeBarbearia: z.string().min(2, { error: "Nome da barbearia muito curto" }),
  email: z.email({ error: "E-mail inválido" }),
  telefone: z.string().optional(),
  cpf: z.string().min(1, { error: "CPF é obrigatório" }),
  senha: z.string().min(6, { error: "Senha precisa ter pelo menos 6 caracteres" }),
});

export const editarBarbeiroSchema = z.object({
  nome: z.string().min(2, { error: "Nome muito curto" }).optional(),
  nomeBarbearia: z.string().min(2, { error: "Nome da barbearia muito curto" }).optional(),
  email: z.email({ error: "E-mail inválido" }).optional(),
  telefone: z.string().optional(),
  cpf: z.string().min(1, { error: "CPF é obrigatório" }).optional(),
  // Opcional: só manda se quiser trocar a senha
  senha: z.string().min(6, { error: "Senha precisa ter pelo menos 6 caracteres" }).optional(),
});