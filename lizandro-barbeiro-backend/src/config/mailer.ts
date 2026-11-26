// src/config/mailer.ts
// Envia e-mails transacionais via Brevo (API HTTP), não SMTP.
//
// Antes isso usava nodemailer + SMTP do Gmail, mas em produção (Render)
// a conexão SMTP de saída fica bloqueada pelo provedor de hospedagem
// gratuito, e o envio travava até estourar "Connection timeout". A API
// HTTP do Brevo contorna isso porque é só uma requisição HTTPS normal
// (porta 443), igual a qualquer outra chamada de API — não depende de
// portas de SMTP (25/465/587) que hospedagens gratuitas costumam bloquear.

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function enviarEmail(destinatario: string, assunto: string, html: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const remetenteEmail = process.env.BREVO_SENDER_EMAIL;
  const remetenteNome = process.env.BREVO_SENDER_NOME || "Lizandro Barbeiro";

  if (!apiKey || !remetenteEmail) {
    throw new Error(
      "BREVO_API_KEY e BREVO_SENDER_EMAIL precisam estar configurados no .env para enviar e-mails.",
    );
  }

  const resposta = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: remetenteNome, email: remetenteEmail },
      to: [{ email: destinatario }],
      subject: assunto,
      htmlContent: html,
    }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    throw new Error(`Falha ao enviar e-mail via Brevo (status ${resposta.status}): ${corpo}`);
  }
}
