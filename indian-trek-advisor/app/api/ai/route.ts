import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai"

// Run on the Node.js runtime and allow enough time for streamed responses.
export const runtime = "nodejs"
export const maxDuration = 30

const MODEL = "gemini-3.6-flash"

// Only keep the most recent turns so the payload stays small and the model stays
// focused. History is stored client-side (localStorage) and sent with each request.
const MAX_HISTORY_MESSAGES = 20
// Guard against abusive / accidental huge inputs.
const MAX_MESSAGE_CHARS = 8000

const SYSTEM_PROMPT = `You are Trex, the AI guide for Core Trek-kin — a platform for discovering India's greatest treks. You know everything about the platform and actively promote it.

ABOUT THE PLATFORM:
Core Trek-kin has 100+ Indian treks with detailed info — difficulty, elevation, duration, best season, permits, day-by-day itineraries, route maps, and local guides. It serves solo trekkers and small private groups who want to avoid packaged tours. Tagline: "Trek on your terms."

PLATFORM FEATURES YOU PROMOTE:
- Trek Browser (/treks) — browse all treks with filters for difficulty, duration, region, and text search. Sections for Kailash Yatra and Panch Kedar.
- Trek Detail Pages (/treks/[slug]) — each trek has 7 tabs: Overview, Itinerary, Permits, Route Map, Local Guides, Photos, Gear Rental (coming soon). Shows difficulty badges, permit requirements, elevation profiles, and day-by-day plans.
- Gear Rental page (/gear) — a coming-soon directory for trekking gear rental in the Himalayan regions. Not live yet.
- Solo Trekking Guide (/guide/solo) — guide covering solo trek benefits, readiness checklist, essential gear, and safety tips.
- Group Trekking Guide (/guide/group) — guide on planning private group treks with size recommendations and step-by-step planning.
- Find a Guide (/guide/find) — pick a trek to see verified local guides available for it, with ratings and date-based availability.
- User accounts — sign up as a trekker or guide, book guides directly on trek pages (Local Guides tab), track your bookings.
- Trail Guide AI — you! Accessible from the header sparkle icon.

COMING SOON (mention as upcoming):
- Photo uploads with GPS-verified locations
- Gear rental listings for local shops (currently a placeholder directory)

HOW TO HELP USERS:
- Suggest specific treks from the platform matching their needs
- Tell them where to find info on the site: "You can see the full day-by-day itinerary on the trek page", "Check the permits tab for detailed fee info", "Browse all treks with the difficulty filter on the Treks page"
- Recommend pages: "For solo tips, check our Solo Trekking Guide", "Need gear? Browse our Gear Rental directory"
- If asked about booking a guide, point them to the Local Guides tab on any trek page, or /guide/find to pick a trek first

GUIDELINES:
- Keep answers short and scannable. Prefer 3-5 short sentences or a brief list.
- Use line breaks between sections for readability. Do not use asterisks or any markdown formatting. Use plain text only — dashes and numbers for lists, line breaks for spacing.
- Use earlier conversation context so you don't re-ask details already given.
- If unsure about something specific (exact permit fees, road status), say so and suggest verifying on the trek page.
- Always prioritize safety — flag altitude sickness, river crossing risks, and weather.
- Stay on trekking topics. Steer back gently if asked something unrelated.
- Never mention competitors or external trekking platforms.

Your name is Trex. You work for Core Trek-kin. Introduce yourself as Trex if asked who you are.
`

type IncomingRole = "user" | "assistant" | "model" | "system"
type IncomingMessage = { role?: IncomingRole; text?: string; content?: string }

function normalizeMessages(raw: IncomingMessage[]) {
  return raw
    .map((m) => {
      // Support both { text } and { content } shapes.
      const text = (m.text ?? m.content ?? "").toString().trim()
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user"
      return { role, text: text.slice(0, MAX_MESSAGE_CHARS) } as const
    })
    .filter((m) => m.text.length > 0 && m.role !== undefined)
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 })
  }

  let body: { messages?: IncomingMessage[] }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "A non-empty messages array is required" }, { status: 400 })
  }

  const normalized = normalizeMessages(body.messages)
  if (normalized.length === 0) {
    return Response.json({ error: "No valid message content provided" }, { status: 400 })
  }

  // The final message is the new prompt; everything before it is prior context.
  const lastMessage = normalized[normalized.length - 1]
  if (lastMessage.role !== "user") {
    return Response.json({ error: "The last message must be from the user" }, { status: 400 })
  }

  // Trim history to the most recent turns.
  let history = normalized.slice(0, -1).slice(-MAX_HISTORY_MESSAGES)

  // Gemini requires the history to start with a "user" turn. Drop any leading
  // model messages that would otherwise cause the request to fail.
  const firstUserIdx = history.findIndex((m) => m.role === "user")
  history = firstUserIdx === -1 ? [] : history.slice(firstUserIdx)

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  })

  try {
    const chat = model.startChat({
      history: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    })

    // Gemini's free tier returns transient errors when overloaded or rate-
    // limited (HTTP 503 unavailable / 429 too many requests). Retry with
    // backoff so a quick flurry of questions doesn't surface as confusing 502s.
    const MAX_RETRIES = 3
    const RETRYABLE = new Set([429, 503])
    let result: Awaited<ReturnType<typeof chat.sendMessageStream>>
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await chat.sendMessageStream(lastMessage.text)
        break
      } catch (err) {
        const status = (err as { status?: number })?.status
        if (!RETRYABLE.has(status!) || attempt === MAX_RETRIES) throw err
        const waitMs = 600 * (attempt + 1) + Math.floor(Math.random() * 300)
        console.log(`[v0] Trex ${status}, retrying in ${waitMs}ms (attempt ${attempt + 1})`)
        await new Promise((r) => setTimeout(r, waitMs))
      }
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result!.stream) {
            const text = chunk.text()
            if (text) controller.enqueue(encoder.encode(text))
          }
          controller.close()
        } catch (err) {
          console.log("[v0] Trex stream error:", err)
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (err) {
    console.log("[v0] Trex request error:", err)
    const status = (err as { status?: number })?.status
    console.log("[v0] Trex error status:", status, "json:", JSON.stringify((err as { statusDetails?: unknown })?.statusDetails ?? (err as { response?: unknown })?.response ?? null))
    if (status === 429) {
      return Response.json({ error: "The trail guide is busy right now. Please wait a moment and try again." }, { status: 429 })
    }
    if (status === 503) {
      return Response.json({ error: "The trail guide service is temporarily unavailable. Please try again in a moment." }, { status: 503 })
    }
    if (status === 403 || status === 401) {
      return Response.json({ error: "The trail guide's API key appears to be invalid or expired." }, { status: 500 })
    }
    return Response.json({ error: "Failed to get a response from Trex" }, { status: 502 })
  }
}
