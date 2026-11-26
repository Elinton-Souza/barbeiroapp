// src/services/agendaService.ts
import { prisma } from "../config/prisma";
import {
  HORA_ABERTURA,
  HORA_FECHAMENTO,
  INTERVALO_INICIO,
  INTERVALO_FIM,
  DURACAO_SLOT_MINUTOS,
  PRAZO_PENDENTE_MINUTOS,
} from "../config/agendaConfig";

function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function diaSemanaDe(data: Date): number {
  return data.getUTCDay(); // 0 = domingo ... 6 = sábado
}

// Status de UM dia: exceção salva (DiaAgenda) tem prioridade;
// se não existir exceção, usa o padrão semanal (ConfiguracaoDiaSemana)
export async function obterStatusDia(data: Date): Promise<boolean> {
  const dataFormatada = formatarData(data);

  const excecao = await prisma.diaAgenda.findUnique({
    where: { data: new Date(dataFormatada) },
  });
  if (excecao) return excecao.trabalha;

  const configuracao = await prisma.configuracaoDiaSemana.findUnique({
    where: { diaSemana: diaSemanaDe(data) },
  });

  // Se ainda não existe configuração salva pra esse dia da semana, assume que trabalha
  return configuracao ? configuracao.trabalhaPadrao : true;
}

// Lista todos os dias de um mês com o status calculado
export async function listarDias(mes: number, ano: number) {
  const primeiroDia = new Date(Date.UTC(ano, mes - 1, 1));
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)); // dia 0 do mês seguinte = último dia deste mês

  const dias: { data: string; trabalha: boolean }[] = [];

  for (
    let d = new Date(primeiroDia);
    d <= ultimoDia;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const trabalha = await obterStatusDia(d);
    dias.push({ data: formatarData(d), trabalha });
  }

  return dias;
}

// Fecha/abre um dia específico (exceção pontual) — usado pelo barbeiro
export async function definirDiaEspecifico(data: string, trabalha: boolean) {
  return prisma.diaAgenda.upsert({
    where: { data: new Date(data) },
    update: { trabalha },
    create: { data: new Date(data), trabalha },
  });
}

// Devolve sempre os 7 dias da semana, mesmo os que ainda não foram configurados
export async function obterConfiguracaoSemanal() {
  const configuracoes = await prisma.configuracaoDiaSemana.findMany({
    orderBy: { diaSemana: "asc" },
  });

  const porDia = new Map(
    configuracoes.map((c) => [c.diaSemana, c.trabalhaPadrao]),
  );

  return Array.from({ length: 7 }, (_, diaSemana) => ({
    diaSemana,
    trabalhaPadrao: porDia.has(diaSemana)
      ? porDia.get(diaSemana)!
      : diaSemana !== 0,
  }));
}

// Atualiza o padrão semanal (um ou mais dias de uma vez)
export async function atualizarConfiguracaoSemanal(
  configuracoes: { diaSemana: number; trabalhaPadrao: boolean }[],
) {
  await prisma.$transaction(
    configuracoes.map((c) =>
      prisma.configuracaoDiaSemana.upsert({
        where: { diaSemana: c.diaSemana },
        update: { trabalhaPadrao: c.trabalhaPadrao },
        create: { diaSemana: c.diaSemana, trabalhaPadrao: c.trabalhaPadrao },
      }),
    ),
  );
  return obterConfiguracaoSemanal();
}

// ---- Horários de 30 min, com status calculado ----

export type StatusHorario = "LIVRE" | "OCUPADO" | "EM_ESPERA";

export interface HorarioDoDia {
  hora: string; // "HH:mm"
  status: StatusHorario;
}

interface IntervaloOcupado {
  inicio: Date;
  fim: Date;
  status: StatusHorario;
}

export async function listarHorariosDoDia(
  data: string,
): Promise<HorarioDoDia[]> {
  const inicioDoDia = new Date(`${data}T00:00:00`);
  const fimDoDia = new Date(`${data}T23:59:59.999`);

  // Busca os itens de agendamento desse dia, junto do status do agendamento "pai"
  const itens = await prisma.agendamentoItem.findMany({
    where: {
      dataHoraInicio: { gte: inicioDoDia, lte: fimDoDia },
      agendamento: { status: { in: ["CONFIRMADO", "PENDENTE_CONFIRMACAO"] } },
    },
    include: { agendamento: true },
  });

  const agora = new Date();
  const intervalosOcupados: IntervaloOcupado[] = [];

  for (const item of itens) {
    const inicio = item.dataHoraInicio;
    const fim = new Date(inicio.getTime() + item.duracaoMinutos * 60000);

    if (item.agendamento.status === "CONFIRMADO") {
      intervalosOcupados.push({ inicio, fim, status: "OCUPADO" });
    } else {
      // PENDENTE_CONFIRMACAO só conta enquanto estiver dentro do prazo
      const expiraEm = new Date(
        item.agendamento.criadoEm.getTime() + PRAZO_PENDENTE_MINUTOS * 60000,
      );
      if (agora < expiraEm) {
        intervalosOcupados.push({ inicio, fim, status: "EM_ESPERA" });
      }
    }
  }

  const horarios: HorarioDoDia[] = [];

  for (let hora = HORA_ABERTURA; hora < HORA_FECHAMENTO; hora++) {
    // Pula o intervalo de almoço inteiro
    if (hora >= INTERVALO_INICIO && hora < INTERVALO_FIM) continue;

    for (let minuto = 0; minuto < 60; minuto += DURACAO_SLOT_MINUTOS) {
      const horarioStr = `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
      const inicioSlot = new Date(`${data}T${horarioStr}:00`);
      const fimSlot = new Date(
        inicioSlot.getTime() + DURACAO_SLOT_MINUTOS * 60000,
      );

      let status: StatusHorario = "LIVRE";
      for (const ocupado of intervalosOcupados) {
        const sobrepoe = inicioSlot < ocupado.fim && fimSlot > ocupado.inicio;
        if (!sobrepoe) continue;

        if (ocupado.status === "OCUPADO") {
          status = "OCUPADO";
          break; // ocupado sempre "ganha", pode parar de checar
        }
        status = "EM_ESPERA";
      }

      horarios.push({ hora: horarioStr, status });
    }
  }

  return horarios;
}

// Verifica se um intervalo [inicio, fim) está livre, sem sobrepor nenhum
// agendamento ativo (CONFIRMADO, ou PENDENTE_CONFIRMACAO ainda dentro do prazo)
export async function intervaloEstaLivre(inicio: Date, fim: Date): Promise<boolean> {
  const itens = await prisma.agendamentoItem.findMany({
    where: {
      dataHoraInicio: { lt: fim },
      agendamento: { status: { in: ["CONFIRMADO", "PENDENTE_CONFIRMACAO"] } },
    },
    include: { agendamento: true },
  });

  const agora = new Date();

  for (const item of itens) {
    const itemInicio = item.dataHoraInicio;
    const itemFim = new Date(itemInicio.getTime() + item.duracaoMinutos * 60000);

    const sobrepoe = inicio < itemFim && fim > itemInicio;
    if (!sobrepoe) continue;

    if (item.agendamento.status === "CONFIRMADO") return false;

    const expiraEm = new Date(
      item.agendamento.criadoEm.getTime() + PRAZO_PENDENTE_MINUTOS * 60000,
    );
    if (agora < expiraEm) return false;
  }

  return true;
}

// ---- Visão semanal do barbeiro (hoje + 5 dias seguintes) ----

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export interface AgendamentoDaSemana {
  id: string;
  hora: string; // "HH:mm"
  tipoServico: string;
  nomeAtendido: string;
  duracaoMinutos: number;
  status: string;
  clienteNome: string;
  clienteTelefone: string | null;
}

export interface DiaDaSemana {
  data: string; // "YYYY-MM-DD"
  trabalha: boolean;
  agendamentos: AgendamentoDaSemana[];
}

// Monta a agenda (status do dia + lista de agendamentos) de UM dia específico.
// Usado tanto pela visão semanal (obterAgendaSemana, que chama isso 6x) quanto
// pela visão de calendário completo do barbeiro, que pode pedir qualquer data.
export async function obterAgendaDoDia(dataStr: string): Promise<DiaDaSemana> {
  const agora = new Date();
  const [anoP, mesP, diaP] = dataStr.split("-").map(Number);

  // obterStatusDia espera um Date em meia-noite UTC representando o dia calendário
  const dataUTCMeiaNoite = new Date(Date.UTC(anoP, mesP - 1, diaP));
  const trabalha = await obterStatusDia(dataUTCMeiaNoite);

  const inicioDoDia = new Date(`${dataStr}T00:00:00`);
  const fimDoDia = new Date(`${dataStr}T23:59:59.999`);

  const itens = await prisma.agendamentoItem.findMany({
    where: {
      dataHoraInicio: { gte: inicioDoDia, lte: fimDoDia },
      agendamento: { status: { in: ["CONFIRMADO", "PENDENTE_CONFIRMACAO"] } },
    },
    include: { agendamento: { include: { cliente: true } } },
    orderBy: { dataHoraInicio: "asc" },
  });

  // Um PENDENTE_CONFIRMACAO só continua "segurando" o horário na visão do
  // barbeiro enquanto estiver dentro do prazo — igual já valia pro cálculo
  // de livre/ocupado (listarHorariosDoDia / intervaloEstaLivre). Depois do
  // prazo, some da lista (o horário volta a estar livre de verdade).
  const itensValidos = itens.filter((item) => {
    if (item.agendamento.status === "CONFIRMADO") return true;
    const expiraEm = new Date(
      item.agendamento.criadoEm.getTime() + PRAZO_PENDENTE_MINUTOS * 60000,
    );
    return agora < expiraEm;
  });

  const agendamentos: AgendamentoDaSemana[] = itensValidos.map((item) => ({
    id: item.agendamentoId,
    hora: `${pad2(item.dataHoraInicio.getHours())}:${pad2(item.dataHoraInicio.getMinutes())}`,
    tipoServico: item.tipoServico,
    nomeAtendido: item.nomeAtendido,
    duracaoMinutos: item.duracaoMinutos,
    status: item.agendamento.status,
    clienteNome: item.agendamento.cliente.nome,
    clienteTelefone: item.agendamento.cliente.telefone,
  }));

  return { data: dataStr, trabalha, agendamentos };
}

export async function obterAgendaSemana(): Promise<DiaDaSemana[]> {
  const agora = new Date();
  const dias: DiaDaSemana[] = [];

  for (let i = 0; i < 6; i++) {
    // Date local (sem Z) — mesma convenção usada no resto do projeto
    const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i);
    const dataStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    dias.push(await obterAgendaDoDia(dataStr));
  }

  return dias;
}
