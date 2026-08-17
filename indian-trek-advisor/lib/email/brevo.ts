const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_API_URL = 'https://api.brevo.com/v3'
const FROM_EMAIL =
  process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || 'noreply@trekadvisor.app'
const FROM_NAME = process.env.BREVO_FROM_NAME || 'Indian Trek Advisor'

export interface EmailParams {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({
  to,
  toName,
  subject,
  html,
  text,
}: EmailParams): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not configured, skipping email')
    return false
  }

  try {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
        ...(text ? { textContent: text } : {}),
      })
    })

    if (!response.ok) {
      console.error('Brevo email error:', await response.text())
    }

    return response.ok
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendVerificationEmail({
  to,
  name,
  actionLink,
}: {
  to: string
  name: string
  actionLink: string
}): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#0b0f0e; color:#e7e5e4; padding:32px;">
      <div style="max-width:520px; margin:0 auto; background:#141a17; border:1px solid #2a332e; border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#16a34a,#0d9488); padding:24px 28px;">
          <div style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.5px;">⛰ Indian Trek Advisor</div>
        </div>
        <div style="padding:32px 28px;">
          <h1 style="margin:0 0 12px; font-size:20px; color:#ffffff;">Confirm your email</h1>
          <p style="margin:0 0 16px; line-height:1.6; color:#d6d3d1; font-size:14px;">
            Hi ${name.split(' ')[0] || 'there'}, welcome! Please confirm your email address to verify your account and get full access to treks, saved lists, guides and bookings.
          </p>
          <a href="${actionLink}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; font-weight:600; padding:12px 22px; border-radius:999px; margin:8px 0 20px;">
            Verify my email
          </a>
          <p style="margin:0 0 8px; font-size:12px; color:#a8a29e;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="margin:0; font-size:11px; color:#78716c; word-break:break-all;">${actionLink}</p>
        </div>
        <div style="padding:16px 28px; border-top:1px solid #2a332e; font-size:11px; color:#78716c;">
          If you didn't create this account, you can safely ignore this email.
        </div>
      </div>
    </div>
  `

  return sendEmail({
    to,
    toName: name,
    subject: 'Verify your email — Indian Trek Advisor',
    html,
  })
}