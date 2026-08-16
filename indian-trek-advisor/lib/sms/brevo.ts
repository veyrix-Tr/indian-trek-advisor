const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_API_URL = 'https://api.brevo.com/v3'
import { formatPhoneNumber } from '@/lib/utils/phone'

export interface SMSParams {
  to: string
  message: string
}

export async function sendSMS({ to, message }: SMSParams): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not configured, skipping SMS')
    return false
  }

  // Format phone number to E.164 before sending
  const formattedPhone = formatPhoneNumber(to)

  try {
    const response = await fetch(`${BREVO_API_URL}/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: 'TrekAdvisor',
        recipient: formattedPhone,
        message: message,
        type: 'transactional'
      })
    })

    if (!response.ok) {
      console.error('SMS API error:', await response.text())
    }

    return response.ok
  } catch (error) {
    console.error('Error sending SMS:', error)
    return false
  }
}

export async function sendBookingRequestSMS(
  guidePhone: string,
  trekkerName: string,
  trekName: string,
  date: string
): Promise<boolean> {
  const message = `New booking request from ${trekkerName} for ${trekName} on ${date}. Please review and approve in your guide dashboard.`
  return sendSMS({ to: guidePhone, message })
}

export async function sendGuideApprovalSMS(
  adminPhone: string,
  guideName: string,
  trekkerName: string,
  trekName: string
): Promise<boolean> {
  const message = `Guide ${guideName} approved booking from ${trekkerName} for ${trekName}. Please review in admin dashboard.`
  return sendSMS({ to: adminPhone, message })
}

export async function sendAdminApprovalSMS(
  trekkerPhone: string,
  guideName: string,
  trekName: string,
  amount: number
): Promise<boolean> {
  const message = `Your booking for ${trekName} with guide ${guideName} has been approved. Please confirm payment of ₹${amount} to proceed.`
  return sendSMS({ to: trekkerPhone, message })
}

export async function sendPaymentConfirmationSMS(
  guidePhone: string,
  trekkerPhone: string,
  guideName: string,
  trekkerName: string,
  trekName: string
): Promise<boolean> {
  const guideMessage = `Payment confirmed for ${trekName} with ${trekkerName}. Contact details: ${trekkerPhone}`
  const trekkerMessage = `Payment confirmed for ${trekName} with guide ${guideName}. Contact details: ${guidePhone}`

  await sendSMS({ to: guidePhone, message: guideMessage })
  return sendSMS({ to: trekkerPhone, message: trekkerMessage })
}

export async function sendCancellationSMS(
  guidePhone: string,
  trekkerPhone: string,
  reason: string
): Promise<boolean> {
  const message = `Booking cancelled. Reason: ${reason}`
  await sendSMS({ to: guidePhone, message })
  return sendSMS({ to: trekkerPhone, message })
}

export async function sendRatingRequestSMS(
  trekkerPhone: string,
  guideName: string,
  trekName: string
): Promise<boolean> {
  const message = `Your trek ${trekName} with guide ${guideName} is complete. Please rate your experience in the dashboard.`
  return sendSMS({ to: trekkerPhone, message })
}
