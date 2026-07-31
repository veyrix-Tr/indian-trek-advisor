"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mountain, Calendar, User, Star, MapPin } from "lucide-react"

interface Booking {
  id: string
  trek_id: string
  status: string
  booking_date: string
  trekker?: { name: string }
  guides?: { trek_name: string }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export function GuideTreksTab({ bookings }: { bookings: Booking[] }) {
  const completed = bookings.filter((b) => b.status === "completed")
  const confirmed = bookings.filter((b) => b.status === "confirmed")

  const trekStats = completed.reduce(
    (acc, b) => {
      const name = b.guides?.trek_name || "Unknown Trek"
      if (!acc[name]) acc[name] = { count: 0, trekkers: [] }
      acc[name].count++
      if (b.trekker?.name) acc[name].trekkers.push(b.trekker.name)
      return acc
    },
    {} as Record<string, { count: number; trekkers: string[] }>
  )

  const topTreks = Object.entries(trekStats)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Trek Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Mountain className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">{completed.length}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-400/10">
                <Calendar className="size-5 text-blue-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">{confirmed.length}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Upcoming
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-yellow-400/10">
                <Star className="size-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">{Object.keys(trekStats).length}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Unique Treks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Treks List */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-primary" />
            Trek Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {topTreks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No completed treks yet
              </p>
            ) : (
              topTreks.map(([name, stats], i) => (
                <motion.div
                  key={name}
                  variants={item}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-4 py-3 transition-colors hover:bg-background/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {stats.count} {stats.count === 1 ? "trek" : "treks"}
                      </p>
                    </div>
                  </div>
                  <div className="flex -space-x-1.5">
                    {stats.trekkers.slice(0, 3).map((t, j) => (
                      <div
                        key={j}
                        className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[9px] font-bold text-white ring-2 ring-card"
                        title={t}
                      >
                        {t.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {stats.trekkers.length > 3 && (
                      <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-2 ring-card">
                        +{stats.trekkers.length - 3}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
