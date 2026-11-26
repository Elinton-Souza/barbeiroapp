import { Request, Response } from "express";
import {
  cadastroSimplesSchema,
  loginSchema,
  googleLoginSchema,
} from "../validations/authSchemas";
import {
  cadastrarClienteSimples,
  autenticarTradicional,
  autenticarGoogle,
} from "../services/usuarioService";
import { gerarToken } from "../utils/jwt";

export async function cadastroSimples(req: Request, res: Response) {
  const resultado = cadastroSimplesSchema.safeParse(req.body);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  try {
    const usuario = await cadastrarClienteSimples(resultado.data);
    const token = gerarToken({ sub: usuario.id, role: "CLIENTE" });
    return res.status(201).json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (erro) {
    return res.status(400).json({ erro: (erro as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  const resultado = loginSchema.safeParse(req.body);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  try {
    const usuario = await autenticarTradicional(resultado.data);
    const token = gerarToken({ sub: usuario.id, role: usuario.role });
    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    });
  } catch (erro) {
    return res.status(401).json({ erro: (erro as Error).message });
  }
}

export async function loginGoogle(req: Request, res: Response) {
  const resultado = googleLoginSchema.safeParse(req.body);
  if (!resultado.success) {
    const mensagem = resultado.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ erro: mensagem });
  }

  try {
    const usuario = await autenticarGoogle(resultado.data.idToken);
    const token = gerarToken({ sub: usuario.id, role: "CLIENTE" });
    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: "CLIENTE",
      },
    });
  } catch (erro) {
    return res.status(401).json({ erro: (erro as Error).message });
  }
}
