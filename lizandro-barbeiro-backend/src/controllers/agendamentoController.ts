// src/controllers/agendamentoController.ts
import { Request, Response } from "express";
import {
  criarAgendamentoSchema,
  confirmarAgendamentoSchema,
  agendamentoManualSchema,
} from "../validations/agendamentoSchemas";
import {
  criarAgendamento,
  confirmarAgendamento,
  cancelarAgendamento,
  criarAgendamentoManual,
  listarMeusAgendamentos,
  listarNotificacoes,
} from "../services/agendamentoService";

export async function criarAgendamentoHandler(req: Request, res: Response) {
  const resultado = criarAgendamentoSchema.safeParse(req.body);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  try {
    const clienteId = req.usuario!.sub;
    const agendamento = await criarAgendamento(clienteId, resultado.data.itens);
    return res.status(201).json(agendamento);
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}

export async function criarAgendamentoManualHandler(req: Request, res: Response) {
  const resultado = agendamentoManualSchema.safeParse(req.body);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  try {
    const agendamento = await criarAgendamentoManual(resultado.data);
    return res.status(201).json(agendamento);
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}

export async function confirmarAgendamentoHandler(req: Request, res: Response) {
  const resultado = confirmarAgendamentoSchema.safeParse(req.body);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  try {
    const { id } = req.params;
    const resposta = await confirmarAgendamento(id as string, resultado.data.token);
    return res.status(200).json(resposta);
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}

export async function cancelarAgendamentoHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const resposta = await cancelarAgendamento(id as string, req.usuario!.sub, req.usuario!.role);
    return res.status(200).json(resposta);
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}

export async function listarMeusAgendamentosHandler(req: Request, res: Response) {
  try {
    const agendamentos = await listarMeusAgendamentos(req.usuario!.sub);
    return res.status(200).json(agendamentos);
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}

export async function listarNotificacoesHandler(req: Request, res: Response) {
  try {
    const notificacoes = await listarNotificacoes(req.usuario!.sub);
    return res.status(200).json(notificacoes);
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}
