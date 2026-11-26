import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function cadastrarClienteSimples(dados: {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}) {
  const existente = await prisma.usuario.findUnique({ where: { email: dados.email } });
  if (existente) throw new Error("Já existe uma conta com esse e-mail");

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  return prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      senha: senhaHash,
      telefone: dados.telefone,
      role: "CLIENTE",
    },
  });
}

export async function autenticarTradicional(dados: {
  email: string;
  senha: string;
  tipo: "CLIENTE" | "BARBEIRO";
}) {
  const usuario = await prisma.usuario.findUnique({ where: { email: dados.email } });
  if (!usuario || !usuario.senha) throw new Error("E-mail ou senha inválidos");

  const senhaCorreta = await bcrypt.compare(dados.senha, usuario.senha);
  if (!senhaCorreta) throw new Error("E-mail ou senha inválidos");

  if (dados.tipo === "CLIENTE" && usuario.role !== "CLIENTE") {
    throw new Error("Essa conta não é de cliente");
  }
  if (dados.tipo === "BARBEIRO" && usuario.role !== "BARBEIRO" && usuario.role !== "ADMIN") {
    throw new Error("Essa conta não tem acesso de barbeiro");
  }

  return usuario;
}

export async function autenticarGoogle(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error("Não foi possível validar o token do Google");

  // Login social sempre vira sessão de CLIENTE, mesmo que o e-mail já seja de um barbeiro/admin
  return prisma.usuario.upsert({
    where: { email: payload.email },
    update: { googleId: payload.sub },
    create: {
      nome: payload.name ?? payload.email,
      email: payload.email,
      googleId: payload.sub,
      role: "CLIENTE",
    },
  });
}

export async function criarBarbeiro(dados: {
  nome: string;
  nomeBarbearia: string;
  email: string;
  telefone?: string;
  cpf: string;
  senha: string;
}) {
  const existente = await prisma.usuario.findUnique({ where: { email: dados.email } });
  if (existente) throw new Error("Já existe uma conta com esse e-mail");

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  return prisma.usuario.create({
    data: {
      nome: dados.nome,
      nomeBarbearia: dados.nomeBarbearia,
      email: dados.email,
      telefone: dados.telefone,
      cpf: dados.cpf,
      senha: senhaHash,
      role: "BARBEIRO",
    },
  });
}

export async function listarBarbeiros() {
  return prisma.usuario.findMany({ where: { role: "BARBEIRO" } });
}

export async function editarBarbeiro(
  id: string,
  dados: {
    nome?: string;
    nomeBarbearia?: string;
    email?: string;
    telefone?: string;
    cpf?: string;
    senha?: string;
  },
) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario || usuario.role !== "BARBEIRO") throw new Error("Barbeiro não encontrado");

  if (dados.email && dados.email !== usuario.email) {
    const existente = await prisma.usuario.findUnique({ where: { email: dados.email } });
    if (existente) throw new Error("Já existe uma conta com esse e-mail");
  }

  const dadosAtualizados: Record<string, unknown> = {
    nome: dados.nome,
    nomeBarbearia: dados.nomeBarbearia,
    email: dados.email,
    telefone: dados.telefone,
    cpf: dados.cpf,
  };

  // Senha só é trocada se o admin realmente digitar uma nova — nunca apaga a atual
  if (dados.senha) {
    dadosAtualizados.senha = await bcrypt.hash(dados.senha, 10);
  }

  return prisma.usuario.update({ where: { id }, data: dadosAtualizados });
}

export async function removerBarbeiro(id: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario || usuario.role !== "BARBEIRO") throw new Error("Barbeiro não encontrado");

  // As notificações desse barbeiro perdem o sentido junto com a conta —
  // apagar primeiro evita erro de chave estrangeira ao excluir o usuário.
  await prisma.notificacao.deleteMany({ where: { usuarioId: id } });

  return prisma.usuario.delete({ where: { id } });
}