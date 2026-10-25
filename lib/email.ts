export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Send an email. Uses Resend when RESEND_API_KEY is configured;
 * otherwise logs the email to the server console (development).
 *
 * To use another provider (SMTP, etc.), replace the body of the
 * `if` branch below.
 */
export async function sendEmail({ to, subject, html, text }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Rifa Día de Muertos <onboarding@resend.dev>",
        to,
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend failed:", res.status, body);
    }
    return;
  }
  // Development fallback — the code is printed to the server console
  // so you can test locally without an email provider.
  console.log(
    `\n──────────────────────────────────────────\n` +
      `📧 [DEV EMAIL → ${to}]\n` +
      `Asunto: ${subject}\n\n${text}\n` +
      `──────────────────────────────────────────\n`,
  );
}

/** Small HTML template with a Día de Muertos touch for auth emails. */
export function emailLayout(opts: {
  title: string;
  body: string;
  code?: string;
}): { html: string; text: string } {
  const { title, body, code } = opts;
  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#1a1018;color:#fde9d0;font-family:Georgia,serif;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p style="font-size:13px;color:#e8a04c;letter-spacing:2px;text-transform:uppercase;">🦴 Rifa Día de Muertos · Takumi Robotics × LIKS</p>
      <h1 style="color:#f7b733;font-size:24px;margin:12px 0;">${title}</h1>
      <div style="background:#2a1822;border:1px solid #4a2a3a;border-radius:12px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;line-height:1.6;">${body}</p>
        ${
          code
            ? `<p style="background:#120b10;border-radius:10px;padding:14px;font-family:monospace;font-size:28px;letter-spacing:8px;text-align:center;color:#7bdfff;margin:16px 0 0;">${code}</p>`
            : ""
        }
      </div>
      <p style="color:#b58aa0;font-size:12px;line-height:1.6;">💀 Si no esperabas este correo, ignóralo. Las flores de cempasúchil guían a los vivos y a los muertos de vuelta a casa.</p>
    </div>
  </body>
</html>`;
  return { html, text: `${title}\n\n${body}${code ? `\n\nTu código: ${code}` : ""}` };
}