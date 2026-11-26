// src/config/agendaConfig.ts

// Horário de funcionamento da barbearia
export const HORA_ABERTURA = 8;      // 08:00
export const HORA_FECHAMENTO = 20;   // 20:00
export const INTERVALO_INICIO = 12;  // 12:00
export const INTERVALO_FIM = 13;     // 13:00

// Duração de cada "slot" (unidade mínima de agendamento)
export const DURACAO_SLOT_MINUTOS = 30;

// Duração de cada tipo de serviço, em minutos
export const DURACAO_SERVICO_MINUTOS: Record<string, number> = {
  CABELO: 30,
  BARBA: 30,
  CABELO_BARBA: 60,
  CRIANCA: 30,
};

// Quantos dias pra frente a agenda deve ser gerada automaticamente
export const DIAS_ANTECEDENCIA_AGENDA = 60;

// Quanto tempo um agendamento PENDENTE_CONFIRMACAO ainda "segura" o horário
// antes de ser tratado como se não existisse mais (volta a ficar livre)
export const PRAZO_PENDENTE_MINUTOS = 15;