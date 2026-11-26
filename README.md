# Lizandro Barbeiro

Sistema de agendamento para barbearia, desenvolvido como Trabalho #3 da disciplina de Programação Full Stack (curso de ADS) — tema "Uso das IAs no desenvolvimento". O código foi construído com apoio de duas IAs: o **backend** com o Claude e o **frontend** com o Gemini, coordenados por um documento de contexto compartilhado (`lizandro-barbeiro-contexto.md`). Todo o processo de desenvolvimento está documentado na pasta [`evidencias/`](./evidencias), em ordem cronológica, e o histórico completo de prompts está em [`lizandro-barbeiro-registro-prompts.md`](./lizandro-barbeiro-registro-prompts.md).

## O que o sistema faz

Três perfis de acesso:

- **Cliente**: cria conta (e-mail/senha ou Google), vê o calendário do mês, escolhe um horário livre, escolhe o serviço (cabelo, barba, cabelo+barba ou criança — podendo agendar um segundo atendimento em sequência, ex. pai e filho), acompanha notificações e confirma o próprio agendamento (pelo app ou por um link enviado por e-mail).
- **Barbeiro**: navega livremente pelo calendário (qualquer mês/dia, não só os próximos dias), vê a agenda completa de cada dia com o status de cada horário (confirmado / aguardando confirmação), fecha ou reabre um dia específico, cadastra manualmente um atendimento de cliente que ligou ou chegou sem usar o app, e avisa o cliente pelo WhatsApp quando o horário é confirmado.
- **Admin**: cadastra, edita e remove contas de barbeiro.

Regras de negócio importantes:

- Um agendamento nasce como `PENDENTE_CONFIRMACAO` e só vira `CONFIRMADO` quando o cliente confirma (pelo app ou pelo link do e-mail); se não confirmar em 15 minutos, o horário volta a ficar livre.
- O status de cada dia/horário é sempre **calculado na hora**, nunca salvo como campo — evita inconsistência entre o que é mostrado e o que realmente está no banco.
- Um horário de hoje que já passou não pode ser agendado pelo cliente (mas o barbeiro pode registrar um atendimento manual num horário passado, para casos de walk-in).
- As telas atualizam sozinhas a cada poucos segundos (polling), então se o cliente confirmar em uma aba, a tela do barbeiro em outra aba reflete isso sem precisar recarregar a página.

## Stack

**Backend** (`lizandro-barbeiro-backend/`): Node.js + Express + TypeScript, Prisma + PostgreSQL, JWT para autenticação, bcrypt para senha, Zod para validação, Nodemailer (Gmail) para e-mail real de confirmação, Google Identity Services para login social.

**Frontend** (`lizandro-barbeiro-front/`): React + Vite + TypeScript, React Router, lucide-react para ícones. Layout em formato de celular (phone frame), com sessão salva em `sessionStorage` (não `localStorage`) propositalmente — isso permite abrir várias abas/janelas logadas como perfis diferentes (cliente, barbeiro, admin) ao mesmo tempo, sem uma sessão sobrescrever a outra.

## Como rodar localmente

### Backend

```bash
cd lizandro-barbeiro-backend
npm install
cp .env.example .env   # preencha com suas credenciais (ver abaixo)
npx prisma migrate dev
npm run dev             # http://localhost:3333
```

Variáveis de ambiente (`.env`):

| Variável | Descrição |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | conexão com o PostgreSQL |
| `JWT_SECRET` | segredo para assinar os tokens de login |
| `ADMIN_EMAIL` / `ADMIN_SENHA` | credenciais do admin criado pelo seed |
| `GOOGLE_CLIENT_ID` | client ID do Google Identity Services |
| `EMAIL_USER` / `EMAIL_SENHA_APP` | conta Gmail (senha de app) usada para enviar os e-mails de confirmação |
| `FRONTEND_URL` | usada para montar o link de confirmação enviado por e-mail |
| `PORT` | porta do servidor (padrão 3333) |

Scripts úteis:

```bash
npx prisma db seed      # cria o usuário ADMIN inicial, a partir de ADMIN_EMAIL/ADMIN_SENHA
npx tsx prisma/reset.ts # apaga usuários/agendamentos pra recomeçar os testes do zero (mantém a config de agenda)
```

### Frontend

```bash
cd lizandro-barbeiro-front
npm install
cp .env.example .env   # preencha VITE_API_URL e VITE_GOOGLE_CLIENT_ID
npm run dev             # http://localhost:5173
```

## Organização do repositório / branches

O histórico foi organizado por módulo, cada um numa branch própria mesclada em `main`:

- `backend-auth` — cadastro, login tradicional e login Google
- `backend-admin` — CRUD de barbeiros pelo admin
- `backend-agenda` — configuração semanal, exceções de dia, horários e calendário do barbeiro
- `backend-agendamento` — criar, confirmar por token, cancelar, manual pelo barbeiro, notificações e e-mail
- `frontend-cliente` — calendário, escolha de serviço/horário, meus agendamentos
- `frontend-barbeiro` — painel do barbeiro
- `frontend-admin` — painel de gestão de barbeiros

## Documentação do processo com IA

- [`lizandro-barbeiro-contexto.md`](./lizandro-barbeiro-contexto.md) — documento de "contrato" entre o backend (Claude) e o frontend (Gemini): rotas, papéis, paleta de cores, formato das respostas da API.
- [`lizandro-barbeiro-registro-prompts.md`](./lizandro-barbeiro-registro-prompts.md) — registro dos prompts usados ao longo do desenvolvimento.
- [`evidencias/`](./evidencias) — capturas de tela numeradas em ordem cronológica (01 a 31), da ideia inicial até os últimos ajustes antes da apresentação.
