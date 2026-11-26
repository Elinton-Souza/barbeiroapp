import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/authRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { agendaRoutes } from "./routes/agendaRoutes";
import { agendamentoRoutes, notificacaoRoutes } from "./routes/agendamentoRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/agenda", agendaRoutes);
app.use("/agendamentos", agendamentoRoutes);
app.use("/notificacoes", notificacaoRoutes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
