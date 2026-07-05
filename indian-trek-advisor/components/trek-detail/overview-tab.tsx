"use client"

import { motion } from "framer-motion"
import { MapPin, ScrollText, Route, Thermometer, HeartPulse } from "lucide-react"
import type { Trek } from "@/lib/data"

const SECTIONS = [
  { key: "location", label: "Location & Terrain", icon: MapPin },
  { key: "history", label: "History & Significance", icon: ScrollText },
  { key: "length", label: "Route & Length", icon: Route },
  { key: "temperature", label: "Weather & Temperature", icon: Thermometer },
  { key: "fitness", label: "Fitness & Preparation", icon: HeartPulse },
] as const

export function OverviewTab({ trek }: { trek: Trek }) {
  const sections = SECTIONS.filter(
    (s) => trek.overview && trek.overview[s.key]
  )

  return (
    <div className="space-y-6">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl text-pretty text-lg leading-relaxed text-foreground"
      >
        {trek.description}
      </motion.p>

      <div className="grid gap-5 md:grid-cols-2">
        {sections.map((section, i) => (
          <motion.section
            key={section.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.4, ease: "easeOut" }}
            className={`rounded-xl border border-border bg-card p-6 ${
              i === 0 ? "md:col-span-2" : ""
            }`}
          >
            <h2 className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest text-primary">
              <section.icon className="size-4" aria-hidden="true" />
              {section.label}
            </h2>
            <p className="mt-3 whitespace-pre-line text-pretty text-sm leading-relaxed text-muted-foreground">
              {trek.overview?.[section.key]}
            </p>
          </motion.section>
        ))}
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Detailed overview coming soon for this trail.
        </p>
      )}
    </div>
  )
}
