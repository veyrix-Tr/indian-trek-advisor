"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react"

const RANGES = [
  { value: "3", label: "3M" },
  { value: "6", label: "6M" },
  { value: "12", label: "12M" },
  { value: "all", label: "All Time" },
]

interface Booking {
  id: string
  status: string
  booking_date: string
  payment_amount?: number
  payment_status?: string
  guides?: { trek_name: string }
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function getMonthLabel(key: string) {
  const [y, m] = key.split("-")
  const date = new Date(Number(y), Number(m) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export function GuideEarningsTab({ bookings }: { bookings: Booking[] }) {
  const [range, setRange] = useState("6")

  const completed = bookings.filter(
    (b) => b.status === "completed" && b.payment_status === "paid"
  )

  const totalEarnings = completed.reduce((sum, b) => sum + (b.payment_amount || 0), 0)

  const monthlyEarnings = completed.reduce(
    (acc, b) => {
      const key = getMonthKey(b.booking_date)
      acc[key] = (acc[key] || 0) + (b.payment_amount || 0)
      return acc
    },
    {} as Record<string, number>
  )

  const sortedMonths = Object.keys(monthlyEarnings).sort().reverse()
  const visibleMonths = range === "all" ? sortedMonths : sortedMonths.slice(0, Number(range))
  const maxMonth = Math.max(...visibleMonths.map((m) => monthlyEarnings[m]), 1)

  const trekEarnings = completed.reduce(
    (acc, b) => {
      const name = b.guides?.trek_name || "Unknown"
      acc[name] = (acc[name] || 0) + (b.payment_amount || 0)
      return acc
    },
    {} as Record<string, number>
  )

  const topTreks = Object.entries(trekEarnings)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const pendingPayments = bookings.filter(
    (b) => b.status === "confirmed" || (b.status === "completed" && b.payment_status !== "paid")
  ).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <IndianRupee className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">₹{totalEarnings.toLocaleString("en-IN")}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Total Earned
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400/10">
                <Calendar className="size-5 text-amber-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">{completed.length}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Paid Treks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-400/10">
                <TrendingUp className="size-5 text-blue-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">{pendingPayments}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Pending Payments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Earnings Chart */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="size-4 text-primary" />
                Monthly Earnings
              </CardTitle>
              <div className="flex gap-1">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRange(r.value)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors duration-150 ${
                      range === r.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/40 bg-background/40 text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {visibleMonths.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No earnings data yet
              </p>
            ) : (
              <div className="space-y-3">
                {visibleMonths.map((month, i) => {
                  const amount = monthlyEarnings[month]
                  const pct = (amount / maxMonth) * 100
                  return (
                    <motion.div
                      key={month}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">
                          {getMonthLabel(month)}
                        </span>
                        <span className="font-mono text-sm font-bold">
                          ₹{amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.05 + 0.1, duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Treks by Earnings */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ArrowUpRight className="size-4 text-green-400" />
              Earnings by Trek
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTreks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No trek earnings yet
              </p>
            ) : (
              <div className="space-y-3">
                {topTreks.map(([name, amount], i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-primary">
                      ₹{amount.toLocaleString("en-IN")}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
