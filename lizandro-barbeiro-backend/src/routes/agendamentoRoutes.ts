// src/routes/agendamentoRoutes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireBarbeiroOuAdmin } from "../middlewares/roleMiddleware";
import {
  criarAgendamentoHandler,
  criarAgendamentoManualHandler,
  confirmarAgendamentoHandler,
  cancelarAgendamentoHandler,
  listarMeusAgendamentosHandler,
  listarNotificacoesHandler,
} from "../controllers/agendamentoController";

export const agendamentoRoutes = Router();
export const notificacaoRoutes = Router();

// Cliente logado cria um agendamento pra si mesmo
agendamentoRoutes.post("/", authMiddleware, criarAgendamentoHandler);

// Barbeiro (ou admin) cria um agendamento manual, pra cliente que ligou/chegou
agendamentoRoutes.post(
  "/manual",
  authMiddleware,
  requireBarbeiroOuAdmin,
  criarAgendamentoManualHandler,
);

// Rota pública — o cliente pode clicar no link do e-mail sem estar logado
agendamentoRoutes.post("/:id/confirmar", confirmarAgendamentoHandler);

// Cancelamento exige login (cliente dono ou barbeiro/admin — checado no service)
agendamentoRoutes.delete("/:id", authMiddleware, cancelarAgendamentoHandler);

// Cliente logado vê os próprios agendamentos
agendamentoRoutes.get("/meus", authMiddleware, listarMeusAgendamentosHandler);

// Notificações do usuário logado (cliente ou barbeiro)
notificacaoRoutes.get("/", authMiddleware, listarNotificacoesHandler);
