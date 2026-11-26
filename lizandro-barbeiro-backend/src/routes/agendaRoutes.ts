// src/routes/agendaRoutes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireBarbeiroOuAdmin } from "../middlewares/roleMiddleware";
import {
  listarDiasHandler,
  definirDiaHandler,
  horariosHandler,
  obterConfiguracaoSemanalHandler,
  atualizarConfiguracaoSemanalHandler,
  agendaSemanaHandler,
  agendaDoDiaHandler,
} from "../controllers/agendaController";

export const agendaRoutes = Router();

// Rotas públicas — cliente ou barbeiro só consultando, sem precisar logar
agendaRoutes.get("/dias", listarDiasHandler);
agendaRoutes.get("/dias/:data/horarios", horariosHandler);

// Rotas exclusivas do barbeiro (ou admin)
agendaRoutes.put(
  "/dias/:data",
  authMiddleware,
  requireBarbeiroOuAdmin,
  definirDiaHandler,
);
agendaRoutes.get(
  "/configuracao-semanal",
  authMiddleware,
  requireBarbeiroOuAdmin,
  obterConfiguracaoSemanalHandler,
);
agendaRoutes.put(
  "/configuracao-semanal",
  authMiddleware,
  requireBarbeiroOuAdmin,
  atualizarConfiguracaoSemanalHandler,
);
// Visão semanal do barbeiro (hoje + 5 dias seguintes, com os agendamentos de cada dia)
agendaRoutes.get(
  "/semana",
  authMiddleware,
  requireBarbeiroOuAdmin,
  agendaSemanaHandler,
);
// Agenda completa (status + agendamentos) de uma data qualquer — usado pelo
// calendário do barbeiro, que pode navegar para qualquer mês/dia, não só os
// próximos 5 dias.
agendaRoutes.get(
  "/dias/:data/agendamentos",
  authMiddleware,
  requireBarbeiroOuAdmin,
  agendaDoDiaHandler,
);
