"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Store, Tent } from "lucide-react"
import type { Trek } from "@/lib/data"
import { Button } from "@/components/ui/button"

function matchRegion(trekState: string): string {
  if (/jammu|kashmir/i.test(trekState)) return "Jammu & Kashmir"
  if (/ladakh/i.test(trekState)) return "Ladakh"
  if (/himachal/i.test(trekState)) return "Himachal Pradesh"
  if (/sikkim/i.test(trekState)) return "Sikkim"
  if (/bengal|arunachal|assam|meghalaya|nagaland/i.test(trekState)) return "Eastern Himalayas"
  return "Uttarakhand"
}

export function GearTab({ trek }: { trek: Trek }) {
  const region = matchRegion(trek.state)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
            Gear Rental Near {trek.baseCamp ?? trek.name}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Rental shops in {region} stocking tents, sleeping bags, crampons, and winter
            layers. Rent locally &mdash; it&apos;s cheaper than buying and supports mountain
            communities.
          </p>
        </div>
        <Button variant="outline" className="rounded-full bg-transparent" nativeButton={false} render={<Link href="/gear" />}>
          All Gear Shops
          <span aria-hidden="true">→</span>
        </Button>
      </div>

      {/* Coming soon panel */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card p-8 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
          <Tent className="size-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="max-w-md">
          <h3 className="font-semibold text-foreground">
            Gear rental listings are launching soon
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            We&apos;re adding local shops near {region} that rent tents, sleeping bags,
            crampons, and more &mdash; bookable directly from this page once live.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
          Coming Soon
        </span>
      </motion.div>
    </div>
  )
}