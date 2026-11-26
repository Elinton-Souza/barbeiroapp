// prisma/reset.ts
// Apaga usuários, agendamentos, itens e notificações — mantém a configuração
// semanal (ConfiguracaoDiaSemana) e as exceções de dias (DiaAgenda) intactas.
// Uso: npx tsx prisma/reset.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const notificacoes = await prisma.notificacao.deleteMany({});
  const itens = await prisma.agendamentoItem.deleteMany({});
  const agendamentos = await prisma.agendamento.deleteMany({});
  const usuarios = await prisma.usuario.deleteMany({});

  console.log("Apagados:");
  console.log("- Notificações:", notificacoes.count);
  console.log("- Itens de agendamento:", itens.count);
  console.log("- Agendamentos:", agendamentos.count);
  console.log("- Usuários:", usuarios.count);
  console.log("\nConfiguração semanal e exceções de dias foram mantidas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
