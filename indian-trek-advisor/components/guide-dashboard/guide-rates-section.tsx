"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IndianRupee, Save, CheckCircle2, AlertCircle } from "lucide-react"
import { getTrekById } from "@/lib/data"

interface Rate {
  id: string
  trek_id: string
  base_rate: number
}

function RateRow({ rate, onSaved }: { rate: Rate; onSaved: (id: string, base_rate: number) => void }) {
  const trek = getTrekById(Number(rate.trek_id))
  const [value, setValue] = useState(String(rate.base_rate))
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null)

  const dirty = Number(value) !== rate.base_rate

  async function handleSave() {
    const parsed = Number(value)
    if (!parsed || parsed <= 0) {
      setFeedback("error")
      setTimeout(() => setFeedback(null), 2500)
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/guide/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rate.id, base_rate: parsed }),
      })
      if (res.ok) {
        onSaved(rate.id, parsed)
        setFeedback("success")
      } else {
        setFeedback("error")
      }
    } catch {
      setFeedback("error")
    }
    setSaving(false)
    setTimeout(() => setFeedback(null), 2500)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{trek?.name || `Trek #${rate.trek_id}`}</p>
        {trek && (
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            {trek.days}d · {trek.state}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative flex-1 sm:flex-none">
          <IndianRupee className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-background/60 py-1.5 pl-7 pr-2 text-sm text-foreground outline-none focus:border-primary/40 sm:w-28"
          />
        </div>
        <span className="font-mono text-[10px] uppercase text-muted-foreground">/day</span>
        <Button
          size="sm"
          variant="outline"
          disabled={!dirty || saving}
          onClick={handleSave}
          className="gap-1 border-border/60"
        >
          <Save className="size-3.5" />
          {saving ? "..." : "Save"}
        </Button>
        <AnimatePresence>
          {feedback && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {feedback === "success" ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <AlertCircle className="size-4 text-destructive" />
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function GuideRatesSection() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/guide/rates")
      .then((res) => res.json())
      .then((data) => setRates(data.rates || []))
      .catch(() => setRates([]))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(id: string, base_rate: number) {
    setRates((prev) => prev.map((r) => (r.id === id ? { ...r, base_rate } : r)))
  }

  if (!loading && rates.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <IndianRupee className="size-4 text-primary" />
            Rates Per Trek
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/30" />
              ))}
            </div>
          ) : (
            rates.map((rate) => <RateRow key={rate.id} rate={rate} onSaved={handleSaved} />)
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
