// src/controllers/agendaController.ts
import { Request, Response } from "express";
import {
  listarDiasQuerySchema,
  definirDiaParamsSchema,
  definirDiaBodySchema,
  horariosParamsSchema,
  configuracaoSemanalBodySchema,
} from "../validations/agendaSchemas";
import {
  listarDias,
  definirDiaEspecifico,
  listarHorariosDoDia,
  obterConfiguracaoSemanal,
  atualizarConfiguracaoSemanal,
  obterAgendaSemana,
  obterAgendaDoDia,
} from "../services/agendaService";

export async function listarDiasHandler(req: Request, res: Response) {
  const resultado = listarDiasQuerySchema.safeParse(req.query);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  const [anoStr, mesStr] = resultado.data.mes.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);

  const dias = await listarDias(mes, ano);
  return res.json(dias);
}

export async function definirDiaHandler(req: Request, res: Response) {
  const paramsResultado = definirDiaParamsSchema.safeParse(req.params);
  const bodyResultado = definirDiaBodySchema.safeParse(req.body);

  if (!paramsResultado.success || !bodyResultado.success) {
    const issues = [
      ...(paramsResultado.success ? [] : paramsResultado.error.issues),
      ...(bodyResultado.success ? [] : bodyResultado.error.issues),
    ];
    const mensagem = issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  const diaAtualizado = await definirDiaEspecifico(
    paramsResultado.data.data,
    bodyResultado.data.trabalha,
  );

  return res.json({
    data: diaAtualizado.data.toISOString().slice(0, 10),
    trabalha: diaAtualizado.trabalha,
  });
}

export async function horariosHandler(req: Request, res: Response) {
  const resultado = horariosParamsSchema.safeParse(req.params);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  const horarios = await listarHorariosDoDia(resultado.data.data);
  return res.json(horarios);
}

export async function obterConfiguracaoSemanalHandler(_req: Request, res: Response) {
  const dias = await obterConfiguracaoSemanal();
  return res.json({ dias });
}

export async function atualizarConfiguracaoSemanalHandler(req: Request, res: Response) {
  const resultado = configuracaoSemanalBodySchema.safeParse(req.body);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  const dias = await atualizarConfiguracaoSemanal(resultado.data.dias);
  return res.json({ dias });
}
export async function agendaSemanaHandler(_req: Request, res: Response) {
  try {
    const semana = await obterAgendaSemana();
    return res.status(200).json(semana);
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}

// GET /agenda/dias/:data/agendamentos — agenda completa (status do dia +
// lista de agendamentos com nome/telefone do cliente) de UMA data qualquer,
// usado pelo calendário completo do barbeiro (não só os próximos 5 dias).
export async function agendaDoDiaHandler(req: Request, res: Response) {
  const resultado = horariosParamsSchema.safeParse(req.params);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  try {
    const dia = await obterAgendaDoDia(resultado.data.data);
    return res.status(200).json(dia);
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}
