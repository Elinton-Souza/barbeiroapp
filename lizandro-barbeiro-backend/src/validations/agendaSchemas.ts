// src/validations/agendaSchemas.ts
import { z } from "zod";

// Valida o formato "YYYY-MM-DD" (usado no :data das rotas)
const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Data deve estar no formato YYYY-MM-DD" });

// GET /agenda/dias?mes=YYYY-MM
export const listarDiasQuerySchema = z.object({
  mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/, { error: "mes deve estar no formato YYYY-MM" }),
});

// PUT /agenda/dias/:data
export const definirDiaParamsSchema = z.object({
  data: dataSchema,
});

export const definirDiaBodySchema = z.object({
  trabalha: z.boolean({ error: "trabalha deve ser true ou false" }),
});

// GET /agenda/dias/:data/horarios
export const horariosParamsSchema = z.object({
  data: dataSchema,
});

// PUT /agenda/configuracao-semanal
export const configuracaoSemanalBodySchema = z.object({
  dias: z.array(
    z.object({
      diaSemana: z.number().min(0).max(6),
      trabalhaPadrao: z.boolean(),
    }),
  ),
});