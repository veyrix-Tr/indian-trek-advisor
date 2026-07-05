import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `You are Trail Guide AI, an expert on Indian trekking. You help trekkers with:

- Trail recommendations based on difficulty, season, location, and experience level
- Permit requirements and how to obtain them for various Indian treks
- Packing and gear advice specific to Indian Himalayan conditions
- Safety tips for solo trekking in India
- Best seasons and weather windows for specific treks
- Acclimatization guidance for high-altitude treks in Ladakh, Uttarakhand, etc.
- Itinerary planning and route details

Keep responses concise, practical, and safety-conscious. If you don't know something specific, say so rather than guessing. Always prioritize safety when giving advice.`

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response("GEMINI_API_KEY is not configured", { status: 500 })
  }

  let body: { messages?: { role: string; text: string }[] }
  try {
    body = await req.json()
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response("Messages array is required", { status: 400 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: SYSTEM_PROMPT,
  })

  const history = body.messages
    .slice(0, -1)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user" as const,
      parts: [{ text: m.text }],
    }))

  const lastMessage = body.messages[body.messages.length - 1]

  try {
    const chat = model.startChat({ history })
    const result = await chat.sendMessageStream(lastMessage.text)

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(new TextEncoder().encode(text))
            }
          }
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    })
  } catch {
    return new Response("Failed to get response from AI", { status: 502 })
  }
}
