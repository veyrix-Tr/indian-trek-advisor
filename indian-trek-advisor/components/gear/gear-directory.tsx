"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Phone, Search, Store, Tent } from "lucide-react"
import { getGearShops, GEAR_REGIONS, GEAR_TYPES } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export function GearDirectory() {
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState<string>("all")
  const [gearType, setGearType] = useState<string>("all")

  const shops = useMemo(() => {
    const q = query.trim().toLowerCase()
    return getGearShops().filter((s) => {
      if (region !== "all" && s.region !== region) return false
      if (
        gearType !== "all" &&
        !s.gear.some((g) => g.toLowerCase().includes(gearType))
      )
        return false
      if (
        q &&
        ![s.name, s.town, s.region, s.desc, ...s.gear]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
  }, [query, region, gearType])

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
          Trekking Gear Rental Shops
        </h1>
        <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Local shops across the Indian Himalayas renting tents, sleeping bags, crampons,
          down jackets, and more. Renting locally is cheaper, lighter to travel with, and
          keeps money in mountain communities.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
          <span className="size-1.5 rounded-full bg-primary/70" aria-hidden="true" />
          Sample directory shown while live rental bookings launch
        </p>
      </motion.div>

      {/* List-your-shop banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-border bg-card/50 p-5"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Store className="size-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">Run a gear shop in the mountains?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Shop listings are coming soon. We&apos;ll let local shops list for free and reach
              trekkers planning routes in their region.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
          Coming Soon
        </span>
      </motion.div>

      {/* Filters */}
      <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shops, towns, gear..."
            aria-label="Search gear shops"
            className="h-11 rounded-full pl-10"
          />
        </div>
        <div className="flex gap-3">
          <Select
            value={region}
            onValueChange={(v) => setRegion(v ?? "all")}
            items={[
              { value: "all", label: "All Regions" },
              ...GEAR_REGIONS.map((r) => ({ value: r, label: r })),
            ]}
          >
            <SelectTrigger className="h-11 w-44 rounded-full" aria-label="Filter by region">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {GEAR_REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={gearType}
            onValueChange={(v) => setGearType(v ?? "all")}
            items={[
              { value: "all", label: "All Gear" },
              ...GEAR_TYPES.map((g) => ({ value: g.value, label: g.label })),
            ]}
          >
            <SelectTrigger className="h-11 w-44 rounded-full" aria-label="Filter by gear type">
              <SelectValue placeholder="All Gear" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gear</SelectItem>
              {GEAR_TYPES.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground" aria-live="polite">
        {shops.length} {shops.length === 1 ? "shop" : "shops"} found
      </p>

      {/* Shop grid */}
      <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shops.map((shop) => (
            <motion.li
              key={shop.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{shop.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3" aria-hidden="true" />
                    {shop.town}, {shop.region}
                  </p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Tent className="size-4 text-primary" aria-hidden="true" />
                </span>
              </div>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {shop.desc}
              </p>

              <ul className="mt-3 flex flex-wrap gap-1.5">
                {shop.gear.map((g) => (
                  <li
                    key={g}
                    className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                  >
                    {g}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5">
                <span className="font-mono text-xs text-primary">{shop.rates}</span>
                <a
                  href={`tel:${shop.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="size-3" aria-hidden="true" />
                  {shop.phone}
                </a>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {shops.length === 0 && (
        <div className="mt-10 rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No shops match those filters. Try a different region or gear type.
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-full bg-transparent"
            onClick={() => {
              setQuery("")
              setRegion("all")
              setGearType("all")
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  )
}
