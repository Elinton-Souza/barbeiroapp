-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('CLIENTE', 'BARBEIRO');

-- CreateEnum
CREATE TYPE "TipoServico" AS ENUM ('CABELO', 'BARBA', 'CABELO_BARBA', 'CRIANCA');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('PENDENTE_CONFIRMACAO', 'CONFIRMADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('AGENDAMENTO_CRIADO', 'AGENDAMENTO_CONFIRMADO', 'AGENDAMENTO_CANCELADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT,
    "googleId" TEXT,
    "telefone" TEXT,
    "role" "RoleUsuario" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoDiaSemana" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "trabalhaPadrao" BOOLEAN NOT NULL,

    CONSTRAINT "ConfiguracaoDiaSemana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaAgenda" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "trabalha" BOOLEAN NOT NULL,

    CONSTRAINT "DiaAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE_CONFIRMACAO',
    "criadoPorBarbeiro" BOOLEAN NOT NULL DEFAULT false,
    "tokenConfirmacao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmadoEm" TIMESTAMP(3),

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendamentoItem" (
    "id" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "tipoServico" "TipoServico" NOT NULL,
    "nomeAtendido" TEXT NOT NULL,
    "dataHoraInicio" TIMESTAMP(3) NOT NULL,
    "duracaoMinutos" INTEGER NOT NULL,

    CONSTRAINT "AgendamentoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "agendamentoId" TEXT,
    "tipo" "TipoNotificacao" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "requerConfirmacao" BOOLEAN NOT NULL DEFAULT false,
    "confirmada" BOOLEAN NOT NULL DEFAULT false,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoDiaSemana_diaSemana_key" ON "ConfiguracaoDiaSemana"("diaSemana");

-- CreateIndex
CREATE UNIQUE INDEX "DiaAgenda_data_key" ON "DiaAgenda"("data");

-- CreateIndex
CREATE UNIQUE INDEX "Agendamento_tokenConfirmacao_key" ON "Agendamento"("tokenConfirmacao");

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendamentoItem" ADD CONSTRAINT "AgendamentoItem_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
