"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, CheckCircle, Star, IndianRupee, TrendingUp, Calendar, Sparkles } from "lucide-react"

interface Stats {
  pending: number
  active: number
  completed: number
  earnings: number
  rating: number
  thisMonth: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  return (
    <span className="tabular-nums">
      {prefix}{value.toLocaleString("en-IN")}
    </span>
  )
}

export function GuideStatsCards({ stats, onGoToProfile }: { stats: Stats; onGoToProfile?: () => void }) {
  const hasAnyBookings = stats.pending + stats.active + stats.completed > 0

  const cards = [
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-status-pending",
      bg: "bg-status-pending/10",
      border: "border-status-pending/20",
      pulse: stats.pending > 0,
    },
    {
      label: "Active",
      value: stats.active,
      icon: Calendar,
      color: "text-status-guide-approved",
      bg: "bg-status-guide-approved/10",
      border: "border-status-guide-approved/20",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-status-completed",
      bg: "bg-status-completed/10",
      border: "border-status-completed/20",
    },
    {
      label: "Earnings",
      value: stats.earnings,
      icon: IndianRupee,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      isCurrency: true,
    },
    {
      label: "Rating",
      value: stats.rating,
      icon: Star,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/20",
      isDecimal: true,
    },
    {
      label: "This Month",
      value: stats.thisMonth,
      icon: TrendingUp,
      color: "text-status-admin-approved",
      bg: "bg-status-admin-approved/10",
      border: "border-status-admin-approved/20",
    },
  ]

  return (
    <div className="space-y-3">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {cards.map((card) => (
          <motion.div key={card.label} variants={item}>
            <Card className={`border ${card.border} bg-card/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}>
              <CardContent className="p-4">
                <div className={`relative mb-3 flex size-9 items-center justify-center rounded-xl ${card.bg}`}>
                  {card.pulse && (
                    <span className="absolute inline-flex size-full animate-ping rounded-xl bg-status-pending/40" />
                  )}
                  <card.icon className={`relative size-4.5 ${card.color}`} />
                </div>
                <p className="font-mono text-2xl font-bold tracking-tight">
                  {card.isDecimal ? (
                    card.value.toFixed(1)
                  ) : card.isCurrency ? (
                    <AnimatedCounter value={card.value} prefix="₹" />
                  ) : (
                    <AnimatedCounter value={card.value} />
                  )}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {!hasAnyBookings && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/40 px-4 py-2.5"
        >
          <Sparkles className="size-3.5 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            No bookings yet —{" "}
            <button onClick={onGoToProfile} className="text-primary underline-offset-2 hover:underline">
              complete your profile
            </button>{" "}
            so trekkers can find and book you.
          </p>
        </motion.div>
      )}
    </div>
  )
}
