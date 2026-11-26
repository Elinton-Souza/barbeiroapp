import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.role !== "ADMIN") {
    return res.status(403).json({ erro: "Acesso restrito ao administrador" });
  }
  next();
}

export function requireBarbeiroOuAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.role !== "BARBEIRO" && req.usuario?.role !== "ADMIN") {
    return res.status(403).json({ erro: "Acesso restrito ao barbeiro" });
  }
  next();
}