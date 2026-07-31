"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Save, CheckCircle2, AlertCircle } from "lucide-react"

interface Payout {
  method: "upi" | "bank_transfer"
  upi_id?: string | null
  bank_account_number?: string | null
  bank_ifsc?: string | null
  bank_account_name?: string | null
}

const METHODS = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
] as const

export function GuidePayoutSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [form, setForm] = useState<Payout>({
    method: "upi",
    upi_id: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_account_name: "",
  })

  useEffect(() => {
    fetch("/api/guide/payout")
      .then((res) => res.json())
      .then((data) => {
        if (data.payout) {
          setForm({
            method: data.payout.method,
            upi_id: data.payout.upi_id || "",
            bank_account_number: data.payout.bank_account_number || "",
            bank_ifsc: data.payout.bank_ifsc || "",
            bank_account_name: data.payout.bank_account_name || "",
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch("/api/guide/payout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setFeedback({ type: "success", message: "Payout details saved" })
      } else {
        const data = await res.json()
        setFeedback({ type: "error", message: data.error || "Failed to save" })
      }
    } catch {
      setFeedback({ type: "error", message: "Network error. Please try again." })
    }
    setSaving(false)
    setTimeout(() => setFeedback(null), 3000)
  }

  const inputClass =
    "w-full rounded-xl border border-border/60 bg-background/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Wallet className="size-4 text-primary" />
            Payout Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 w-48 animate-pulse rounded-xl bg-muted/30" />
              <div className="h-10 animate-pulse rounded-xl bg-muted/30" />
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm({ ...form, method: m.value })}
                    className={`rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 ${
                      form.method === m.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/40 bg-background/40 text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {form.method === "upi" ? (
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={form.upi_id || ""}
                    onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                    placeholder="yourname@upi"
                    className={inputClass}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={form.bank_account_name || ""}
                      onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                      placeholder="As per bank records"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={form.bank_account_number || ""}
                        onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={form.bank_ifsc || ""}
                        onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })}
                        className={`${inputClass} uppercase`}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  <Save className="size-4" />
                  {saving ? "Saving..." : "Save Payout Details"}
                </Button>
                <AnimatePresence>
                  {feedback && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-1 font-mono text-xs ${feedback.type === "success" ? "text-primary" : "text-destructive"}`}
                    >
                      {feedback.type === "success" ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                      {feedback.message}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
