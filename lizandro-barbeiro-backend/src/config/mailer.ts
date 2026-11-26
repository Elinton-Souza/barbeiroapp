// src/config/mailer.ts
import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_SENHA_APP,
  },
});

export async function enviarEmail(destinatario: string, assunto: string, html: string) {
  await mailer.sendMail({
    from: `"Lizandro Barbeiro" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: assunto,
    html,
  });
}
