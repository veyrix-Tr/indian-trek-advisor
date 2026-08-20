"use client"

import { motion } from "framer-motion"
import { MapPin, Store, Tent } from "lucide-react"
import { GEAR_REGIONS, GEAR_TYPES } from "@/lib/data"

export function GearDirectory() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
          <Tent className="size-3.5" aria-hidden="true" />
          Rent, Don&apos;t Buy
        </p>
        <h1 className="mt-3 max-w-2xl text-balance font-sans text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Trekking Gear Rental
        </h1>
        <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Local shops across the Indian Himalayas renting tents, sleeping bags, crampons,
          down jackets, and more. Renting locally is cheaper, lighter to travel with, and
          keeps money in mountain communities.
        </p>
      </motion.div>

      {/* Coming soon panel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mt-10 flex flex-col gap-6 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Store className="size-8 text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="mx-auto flex max-w-md flex-col gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Live rental listings are on the way
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We&apos;re onboarding mountain gear shops so you can browse and book tents,
            sleeping bags, crampons, and more near your trailhead &mdash; directly from
            the trek pages.
          </p>
        </div>
        <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
          Coming Soon
        </span>
      </motion.div>

      {/* Region/gear scope */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-primary">
            Regions Covered
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GEAR_REGIONS.map((r) => (
              <span
                key={r}
                className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-primary">
            Gear Types Planned
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GEAR_TYPES.map((g) => (
              <span
                key={g.value}
                className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
              >
                {g.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground/70">
        <MapPin className="size-3.5" aria-hidden="true" />
        Shop owners &mdash; get in touch to be listed first.
      </p>
    </div>
  )
}