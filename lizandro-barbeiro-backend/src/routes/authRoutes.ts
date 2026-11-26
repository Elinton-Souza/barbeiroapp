import { Router } from "express";
import { cadastroSimples, login, loginGoogle } from "../controllers/authController";

export const authRoutes = Router();

authRoutes.post("/cadastro", cadastroSimples);
authRoutes.post("/login", login);
authRoutes.post("/google", loginGoogle);