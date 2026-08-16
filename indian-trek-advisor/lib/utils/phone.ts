/**
 * Formats a phone number to E.164 format for SMS sending
 * Accepts various Indian phone formats and converts to +91XXXXXXXXXX
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // If already has country code (91), format as +91XXXXXXXXXX
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`
  }
  
  // If 10 digits (Indian number without country code), add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }
  
  // If already has + prefix, return as is
  if (phone.startsWith('+')) {
    return phone
  }
  
  // Default: try to add +91 if it looks like an Indian number
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }
  
  // Return original if we can't format it
  return phone
}

/**
 * Validates if a phone number is in proper format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  // E.164 format for India: +91 followed by 10 digits
  return /^\+91\d{10}$/.test(formatted)
}
