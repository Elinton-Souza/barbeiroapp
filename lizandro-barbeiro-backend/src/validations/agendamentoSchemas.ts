// src/validations/agendamentoSchemas.ts
import { z } from "zod";

const tipoServicoEnum = z.enum(["CABELO", "BARBA", "CABELO_BARBA", "CRIANCA"]);

const itemAgendamentoSchema = z.object({
  tipoServico: tipoServicoEnum,
  nomeAtendido: z.string().min(1, { error: "nomeAtendido é obrigatório" }),
  // Vem como "YYYY-MM-DDTHH:mm:ss", hora local, sem Z — igual ao resto da agenda
  dataHoraInicio: z.string().min(1, { error: "dataHoraInicio é obrigatório" }),
});

// POST /agendamentos — 1 ou 2 itens (ex.: cliente + filho)
export const criarAgendamentoSchema = z.object({
  itens: z.array(itemAgendamentoSchema).min(1).max(2),
});

// POST /agendamentos/:id/confirmar
export const confirmarAgendamentoSchema = z.object({
  token: z.string().min(1, { error: "token é obrigatório" }),
});

// POST /agendamentos/manual — o barbeiro só informa nome/e-mail/telefone do cliente
export const agendamentoManualSchema = z.object({
  nome: z.string().min(2, { error: "Nome muito curto" }),
  email: z.email({ error: "E-mail inválido" }),
  telefone: z.string().optional(),
  tipoServico: tipoServicoEnum,
  dataHoraInicio: z.string().min(1, { error: "dataHoraInicio é obrigatório" }),
});
