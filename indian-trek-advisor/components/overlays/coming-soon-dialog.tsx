"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mountain, BellRing, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ComingSoonContext } from "./overlay-provider"

export function ComingSoonDialog({
  context,
  onClose,
}: {
  context: ComingSoonContext
  onClose: () => void
}) {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const title = context.title ?? "This feature is on its way"
  const message =
    context.message ??
    "We are working hard to bring this to you. Leave your email and we will let you know the moment it is live."

  function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden border-border bg-card p-0">
        <div className="relative flex flex-col items-center gap-4 px-6 pb-8 pt-10 text-center">
          {/* Peak silhouette backdrop */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-primary/5"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 100 L60 40 L110 75 L170 15 L230 70 L290 30 L340 65 L400 25 L400 100 Z"
              fill="currentColor"
            />
          </svg>

          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"
          >
            <Mountain className="size-7" aria-hidden="true" />
          </motion.div>

          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Coming Soon
          </p>

          <DialogTitle className="text-balance text-2xl font-bold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-pretty leading-relaxed text-muted-foreground">
            {message}
          </DialogDescription>

          {subscribed ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-mono text-sm text-primary"
            >
              <Check className="size-4" aria-hidden="true" />
              {"You're on the list. We'll be in touch."}
            </motion.div>
          ) : (
            <form
              onSubmit={handleNotify}
              className="relative flex w-full items-center gap-2"
            >
              <label htmlFor="cs-email" className="sr-only">
                Email for launch notification
              </label>
              <Input
                id="cs-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
              />
              <Button type="submit" className="shrink-0 gap-1.5">
                <BellRing className="size-4" aria-hidden="true" />
                Notify me
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
