// src/services/agendamentoService.ts
import { prisma } from "../config/prisma";
import { enviarEmail } from "../config/mailer";
import { intervaloEstaLivre } from "./agendaService";
import { DURACAO_SERVICO_MINUTOS } from "../config/agendaConfig";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

type TipoServico = "CABELO" | "BARBA" | "CABELO_BARBA" | "CRIANCA";

interface ItemEntrada {
  tipoServico: TipoServico;
  nomeAtendido: string;
  dataHoraInicio: string;
}

interface ItemValidado {
  tipoServico: TipoServico;
  nomeAtendido: string;
  dataHoraInicio: Date;
  duracaoMinutos: number;
}

// A duração nunca vem do cliente — é sempre derivada do tipoServico aqui no
// backend, pra evitar que alguém manipule o payload e "encolha" o horário.
// permitirHorarioPassado: só true pro agendamento manual do barbeiro (ex:
// registrar um walk-in que já começou) — o cliente nunca pode agendar um
// horário que já passou.
async function validarItens(
  itensEntrada: ItemEntrada[],
  permitirHorarioPassado: boolean = false,
): Promise<ItemValidado[]> {
  const itensValidados: ItemValidado[] = [];

  for (const entrada of itensEntrada) {
    const duracaoMinutos = DURACAO_SERVICO_MINUTOS[entrada.tipoServico];
    const inicio = new Date(entrada.dataHoraInicio);
    const fim = new Date(inicio.getTime() + duracaoMinutos * 60000);

    if (!permitirHorarioPassado && inicio.getTime() < Date.now()) {
      throw new Error("Não é possível agendar um horário que já passou");
    }

    const livre = await intervaloEstaLivre(inicio, fim);
    if (!livre) {
      throw new Error(`O horário ${entrada.dataHoraInicio} não está mais disponível`);
    }

    itensValidados.push({
      tipoServico: entrada.tipoServico,
      nomeAtendido: entrada.nomeAtendido,
      dataHoraInicio: inicio,
      duracaoMinutos,
    });
  }

  return itensValidados;
}

function linkConfirmacao(agendamentoId: string, token: string) {
  return `${FRONTEND_URL}/confirmar?id=${agendamentoId}&token=${token}`;
}

function linkWhatsapp(telefone: string | null | undefined, mensagem: string) {
  const numero = (telefone ?? "").replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

function formatarResumo(itens: { tipoServico: string; dataHoraInicio: Date }[]) {
  return itens
    .map((i) => `${i.tipoServico} às ${i.dataHoraInicio.toLocaleString("pt-BR")}`)
    .join(" e ");
}

async function buscarBarbeiro() {
  return prisma.usuario.findFirst({ where: { role: "BARBEIRO" } });
}

async function dispararNotificacaoCriacao(
  agendamentoId: string,
  tokenConfirmacao: string,
  cliente: { id: string; nome: string; email: string },
  itens: ItemValidado[],
) {
  const resumo = formatarResumo(itens);
  const link = linkConfirmacao(agendamentoId, tokenConfirmacao);

  // Notificação do cliente — é a única que exige confirmação (botão OK)
  await prisma.notificacao.create({
    data: {
      usuarioId: cliente.id,
      agendamentoId,
      tipo: "AGENDAMENTO_CRIADO",
      mensagem: `Seu agendamento (${resumo}) foi registrado. Confirme pra garantir o horário.`,
      requerConfirmacao: true,
    },
  });

  const barbeiro = await buscarBarbeiro();
  if (barbeiro) {
    await prisma.notificacao.create({
      data: {
        usuarioId: barbeiro.id,
        agendamentoId,
        tipo: "AGENDAMENTO_CRIADO",
        mensagem: `Novo agendamento de ${cliente.nome} (${resumo}), aguardando confirmação.`,
        requerConfirmacao: false,
      },
    });
  }

  await enviarEmail(
    cliente.email,
    "Confirme seu agendamento — Lizandro Barbeiro",
    `<p>Olá, ${cliente.nome}!</p><p>Seu agendamento (${resumo}) foi registrado.</p><p>Clique no link abaixo pra confirmar:</p><p><a href="${link}">${link}</a></p>`,
  );

  if (barbeiro) {
    await enviarEmail(
      barbeiro.email,
      "Novo agendamento — Lizandro Barbeiro",
      `<p>Novo agendamento de ${cliente.nome} (${resumo}), aguardando confirmação do cliente.</p>`,
    );
  }
}

export async function criarAgendamento(
  clienteId: string,
  itensEntrada: ItemEntrada[],
  criadoPorBarbeiro: boolean = false,
) {
  const cliente = await prisma.usuario.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new Error("Cliente não encontrado");

  const itensValidados = await validarItens(itensEntrada, criadoPorBarbeiro);

  const agendamento = await prisma.agendamento.create({
    data: {
      clienteId,
      criadoPorBarbeiro,
      itens: {
        create: itensValidados.map((item) => ({
          tipoServico: item.tipoServico,
          nomeAtendido: item.nomeAtendido,
          dataHoraInicio: item.dataHoraInicio,
          duracaoMinutos: item.duracaoMinutos,
        })),
      },
    },
    include: { itens: true },
  });

  await dispararNotificacaoCriacao(
    agendamento.id,
    agendamento.tokenConfirmacao,
    { id: cliente.id, nome: cliente.nome, email: cliente.email },
    itensValidados,
  );

  return agendamento;
}

export async function confirmarAgendamento(agendamentoId: string, token: string) {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    include: { cliente: true, itens: true },
  });

  if (!agendamento) throw new Error("Agendamento não encontrado");
  if (agendamento.tokenConfirmacao !== token) throw new Error("Token de confirmação inválido");
  if (agendamento.status === "CANCELADO") throw new Error("Esse agendamento já foi cancelado");

  if (agendamento.status === "CONFIRMADO") {
    return { status: "CONFIRMADO", linkWhatsapp: null };
  }

  await prisma.agendamento.update({
    where: { id: agendamentoId },
    data: { status: "CONFIRMADO", confirmadoEm: new Date() },
  });

  await prisma.notificacao.updateMany({
    where: { agendamentoId, requerConfirmacao: true },
    data: { confirmada: true },
  });

  const resumo = formatarResumo(agendamento.itens);
  const mensagemWhatsapp = `Olá! Seu agendamento (${resumo}) na Lizandro Barbeiro está confirmado. ✂️`;
  const whatsapp = linkWhatsapp(agendamento.cliente.telefone, mensagemWhatsapp);

  const barbeiro = await buscarBarbeiro();
  if (barbeiro) {
    await prisma.notificacao.create({
      data: {
        usuarioId: barbeiro.id,
        agendamentoId,
        tipo: "AGENDAMENTO_CONFIRMADO",
        mensagem: `${agendamento.cliente.nome} confirmou o agendamento (${resumo}).`,
        requerConfirmacao: false,
      },
    });
  }

  return { status: "CONFIRMADO", linkWhatsapp: whatsapp };
}

export async function cancelarAgendamento(
  agendamentoId: string,
  solicitanteId: string,
  role: string,
) {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    include: { cliente: true },
  });

  if (!agendamento) throw new Error("Agendamento não encontrado");

  const ehDono = agendamento.clienteId === solicitanteId;
  const ehBarbeiro = role === "BARBEIRO" || role === "ADMIN";
  if (!ehDono && !ehBarbeiro) {
    throw new Error("Você não tem permissão pra cancelar esse agendamento");
  }

  await prisma.agendamento.update({
    where: { id: agendamentoId },
    data: { status: "CANCELADO" },
  });

  const barbeiro = await buscarBarbeiro();
  const notificarUsuarioId = ehDono ? barbeiro?.id : agendamento.clienteId;

  if (notificarUsuarioId) {
    await prisma.notificacao.create({
      data: {
        usuarioId: notificarUsuarioId,
        agendamentoId,
        tipo: "AGENDAMENTO_CANCELADO",
        mensagem: `O agendamento de ${agendamento.cliente.nome} foi cancelado.`,
      },
    });
  }

  return { status: "CANCELADO" };
}

// Agendamento feito pelo barbeiro, pra um cliente que ligou ou chegou sem
// usar o app — só precisa de nome/e-mail/telefone, o resto é automático
export async function criarAgendamentoManual(dados: {
  nome: string;
  email: string;
  telefone?: string;
  tipoServico: TipoServico;
  dataHoraInicio: string;
}) {
  // Se já existe uma conta com esse e-mail, só pode ser mexida se for CLIENTE —
  // nunca sobrescrever o nome de uma conta de barbeiro/admin por engano
  const existente = await prisma.usuario.findUnique({ where: { email: dados.email } });
  if (existente && existente.role !== "CLIENTE") {
    throw new Error(
      "Esse e-mail já pertence a uma conta de barbeiro/admin. Use outro e-mail para o cliente.",
    );
  }

  const cliente = await prisma.usuario.upsert({
    where: { email: dados.email },
    update: { nome: dados.nome, telefone: dados.telefone },
    create: {
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      role: "CLIENTE",
    },
  });

  const agendamento = await criarAgendamento(
    cliente.id,
    [
      {
        tipoServico: dados.tipoServico,
        nomeAtendido: dados.nome,
        dataHoraInicio: dados.dataHoraInicio,
      },
    ],
    true,
  );

  return agendamento;
}

export async function listarMeusAgendamentos(clienteId: string) {
  return prisma.agendamento.findMany({
    where: { clienteId },
    include: { itens: true },
    orderBy: { criadoEm: "desc" },
  });
}

export async function listarNotificacoes(usuarioId: string) {
  return prisma.notificacao.findMany({
    where: { usuarioId },
    orderBy: { criadaEm: "desc" },
  });
}
