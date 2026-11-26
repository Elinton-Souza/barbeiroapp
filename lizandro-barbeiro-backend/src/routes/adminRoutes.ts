import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireAdmin } from "../middlewares/roleMiddleware";
import {
  criarBarbeiroHandler,
  editarBarbeiroHandler,
  listarBarbeirosHandler,
  removerBarbeiroHandler,
} from "../controllers/adminController";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireAdmin);

adminRoutes.post("/barbeiros", criarBarbeiroHandler);
adminRoutes.get("/barbeiros", listarBarbeirosHandler);
adminRoutes.put("/barbeiros/:id", editarBarbeiroHandler);
adminRoutes.delete("/barbeiros/:id", removerBarbeiroHandler);