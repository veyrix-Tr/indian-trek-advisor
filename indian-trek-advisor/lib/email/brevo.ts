const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_API_URL = 'https://api.brevo.com/v3'
const FROM_EMAIL =
  process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || 'noreply@trekadvisor.app'
const FROM_NAME = process.env.BREVO_FROM_NAME || 'Core Trek-kin'

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

export async function sendOtpEmail({
  to,
  name,
  otp,
  purpose,
}: {
  to: string
  name?: string
  otp: string
  purpose: 'verification' | 'password reset'
}): Promise<boolean> {
  const message =
    purpose === 'verification'
      ? 'to verify your email address and activate your account.'
      : 'to reset the password for your Core Trek-kin account.'

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#0b0f0e; color:#e7e5e4; padding:32px;">
      <div style="max-width:520px; margin:0 auto; background:#141a17; border:1px solid #2a332e; border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#16a34a,#0d9488); padding:24px 28px;">
          <div style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.5px;">⛰ Core Trek-kin</div>
        </div>
        <div style="padding:32px 28px; text-align:center;">
          <h1 style="margin:0 0 12px; font-size:20px; color:#ffffff;">
            ${purpose === 'verification' ? 'Verify your email' : 'Reset your password'}
          </h1>
          <p style="margin:0 0 20px; line-height:1.6; color:#d6d3d1; font-size:14px;">
            ${name ? `Hi ${name.split(' ')[0]}, ` : ''}Use the code below ${message}
            Enter it on the site to continue. It expires in 10 minutes.
          </p>
          <div style="display:inline-block; background:#0b0f0e; border:1px dashed #16a34a; border-radius:12px; padding:18px 42px; font-size:32px; font-weight:700; letter-spacing:8px; color:#ffffff;">
            ${otp}
          </div>
          <p style="margin:20px 0 0; font-size:12px; color:#a8a29e;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    </div>
  `

  return sendEmail({
    to,
    toName: name,
    subject: `Your ${purpose} code — Core Trek-kin`,
    html,
  })
}