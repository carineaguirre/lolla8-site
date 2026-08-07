import type { APIRoute } from 'astro'
import { Resend } from 'resend'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const userEmailHtml = (email: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <p style="color:#d4a259;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 36px;">lolla8</p>
    <h1 style="color:#f0ece4;font-size:30px;font-weight:800;letter-spacing:-0.02em;line-height:1.1;margin:0 0 20px;">Você está na lista.</h1>
    <p style="color:rgba(240,236,228,0.65);font-size:16px;line-height:1.7;margin:0 0 16px;">
      Obrigado por se cadastrar, ${escapeHtml(email)}.
    </p>
    <p style="color:rgba(240,236,228,0.65);font-size:16px;line-height:1.7;margin:0 0 16px;">
      Quando o lolla8 estiver pronto, você será um dos primeiros a saber — prometemos avisar antes de todo mundo.
    </p>
    <p style="color:rgba(240,236,228,0.65);font-size:16px;line-height:1.7;margin:0 0 48px;">
      O lolla8 é uma plataforma feita para quem faz com as mãos: artesãos, criadores e ateliers que merecem uma ferramenta à altura do seu trabalho.
    </p>
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;">
      <p style="color:rgba(240,236,228,0.3);font-size:12px;margin:0;line-height:1.6;">
        © 2026 lolla8 ·
        <a href="https://lolla8.com" style="color:#d4a259;text-decoration:none;">lolla8.com</a>
      </p>
    </div>
  </div>
</body>
</html>
`

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''

  if (!email || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: 'E-mail inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const key = import.meta.env.RESEND_API_KEY
  if (!key) {
    return new Response(JSON.stringify({ error: 'Serviço indisponível.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const audienceId = import.meta.env.RESEND_AUDIENCE_ID
  const resend = new Resend(key)

  // Resend SDK returns { data, error } — it never throws, so we must check the error field
  const [r1, r2] = await Promise.all([
    resend.emails.send({
      from: 'lolla8 <hello@lolla8.com>',
      to: email,
      subject: 'Você está na lista ✦',
      html: userEmailHtml(email),
    }),
    resend.emails.send({
      from: 'lolla8 <hello@lolla8.com>',
      to: 'carinecontato@gmail.com',
      subject: `Novo cadastro: ${escapeHtml(email)}`,
      html: `<p style="font-family:sans-serif;">Novo e-mail cadastrado na lista de espera:<br><strong>${escapeHtml(email)}</strong></p>`,
    }),
  ])

  if (r1.error || r2.error) {
    const msg = r1.error?.message ?? r2.error?.message ?? 'Erro ao enviar.'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Audience is best-effort — failure doesn't affect the user response
  if (audienceId) {
    resend.contacts.create({ audienceId, email, unsubscribed: false }).catch(() => {})
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
