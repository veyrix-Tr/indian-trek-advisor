const BAD_WORDS = new Set([
  "ass", "arse", "bastard", "bitch", "bloody", "bollocks", "bullshit",
  "crap", "cunt", "damn", "dick", "douche", "fag", "fuck", "fucker",
  "motherfucker", "nigga", "nigger", "piss", "prick", "pussy", "retard",
  "shit", "slut", "twat", "wanker", "whore",
])

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z\s]/g, "")
}

function containsProfanity(text: string): string | null {
  const normalizedText = normalize(text).trim()
  if (!normalizedText) return null

  for (const token of normalizedText.split(/\s+/)) {
    if (!token) continue
    if (BAD_WORDS.has(token)) return token
  }
  return null
}

export function moderateText(text?: string | null): {
  clean: boolean
  matchedWord?: string
} {
  const value = (text ?? "").trim()
  if (!value) return { clean: true }

  const matched = containsProfanity(value)
  return matched ? { clean: false, matchedWord: matched } : { clean: true }
}