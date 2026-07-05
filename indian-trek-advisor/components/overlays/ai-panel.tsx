"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mountain, SendHorizonal, Sparkles, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const STORAGE_KEY = "trek-ai-messages"

const QUICK_PROMPTS = [
  "Best beginner Indian Himalayan trek",
  "Kedarkantha vs Kashmir Great Lakes",
  "Solo trekking safety tips India",
  "Gear for Indian winter treks",
  "Acclimatization for Ladakh treks",
  "Best season for Uttarakhand treks",
]

interface Message {
  id: number
  role: "user" | "assistant"
  text: string
}

export function AiPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const nextId = useRef(messages.reduce((max, m) => Math.max(max, m.id), 0) + 1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, typing])

  function clearChat() {
    abortRef.current?.abort()
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
    nextId.current = 1
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const userMsg: Message = { id: nextId.current++, role: "user", text: trimmed }
    const assistantMsg: Message = { id: nextId.current++, role: "assistant", text: "" }

    setMessages((m) => [...m, userMsg, assistantMsg])
    setInput("")
    setTyping(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, text: m.text })),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error("Request failed")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantMsg.id ? { ...msg, text: buffer } : msg)),
        )
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantMsg.id
            ? { ...msg, text: "Sorry, I couldn't reach the trail guide. Please try again." }
            : msg,
        ),
      )
    } finally {
      setTyping(false)
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-border bg-card p-0 data-[side=right]:sm:max-w-xl">
        <SheetHeader className="relative border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
            </span>
            Trail Guide AI
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Ask anything about India&apos;s trails, permits, gear, and seasons.
          </SheetDescription>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="absolute bottom-4 right-12 flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 shadow-xs transition-all hover:bg-red-500/20 hover:text-red-400 active:scale-95"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col justify-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Mountain className="size-5 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-4 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Try a quick question
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ul className="space-y-3" aria-live="polite">
            <AnimatePresence initial={false}>
              {messages.filter((m) => m.text).map((m) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground"
                        : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground"
                    }
                  >
                    {m.role === "assistant" ? m.text.replaceAll("*", "") : m.text}
                  </div>
                </motion.li>
              ))}
              {typing && (
                <motion.li
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div
                    className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3"
                    aria-label="Trail Guide AI is typing"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="size-1.5 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.li>
              )}
            </AnimatePresence>
          </ul>
        </div>

        <form
          className="flex items-center gap-2 border-t border-border px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any trail..."
            aria-label="Message Trail Guide AI"
            className="h-11 rounded-full"
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            aria-label="Send message"
            disabled={!input.trim() || typing}
          >
            <SendHorizonal className="size-4" aria-hidden="true" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
