import { Request, Response } from "express";
import { criarBarbeiroSchema, editarBarbeiroSchema } from "../validations/adminSchemas";
import {
  criarBarbeiro,
  editarBarbeiro,
  listarBarbeiros,
  removerBarbeiro,
} from "../services/usuarioService";

export async function criarBarbeiroHandler(req: Request, res: Response) {
  const resultado = criarBarbeiroSchema.safeParse(req.body);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  try {
    const barbeiro = await criarBarbeiro(resultado.data);
    return res.status(201).json({
      id: barbeiro.id,
      nome: barbeiro.nome,
      nomeBarbearia: barbeiro.nomeBarbearia,
      email: barbeiro.email,
    });
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}

export async function listarBarbeirosHandler(_req: Request, res: Response) {
  const barbeiros = await listarBarbeiros();
  return res.json(
    barbeiros.map((b) => ({
      id: b.id,
      nome: b.nome,
      nomeBarbearia: b.nomeBarbearia,
      email: b.email,
      telefone: b.telefone,
    })),
  );
}

export async function editarBarbeiroHandler(req: Request, res: Response) {
  const resultado = editarBarbeiroSchema.safeParse(req.body);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  try {
    const barbeiro = await editarBarbeiro(req.params.id as string, resultado.data);
    return res.json({
      id: barbeiro.id,
      nome: barbeiro.nome,
      nomeBarbearia: barbeiro.nomeBarbearia,
      email: barbeiro.email,
      telefone: barbeiro.telefone,
      cpf: barbeiro.cpf,
    });
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}

export async function removerBarbeiroHandler(req: Request, res: Response) {
  try {
    await removerBarbeiro(req.params.id as string);
    return res.status(204).send();
  } catch (erro) {
    return res.status(404).json({ erro: (erro as Error).message });
  }
}
