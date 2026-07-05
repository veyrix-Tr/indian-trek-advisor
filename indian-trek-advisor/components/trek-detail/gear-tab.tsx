"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Phone, Tent } from "lucide-react"
import type { Trek } from "@/lib/data"
import { getGearShops } from "@/lib/data"
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
  const shops = getGearShops().filter((s) => s.region === region)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
            Gear Rental Near {trek.baseCamp ?? trek.name}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Rental shops in {region} stocking tents, sleeping bags, crampons, and winter
            layers. Rent locally — it&apos;s cheaper than buying and supports mountain
            communities.
          </p>
        </div>
        <Button variant="outline" className="rounded-full bg-transparent" nativeButton={false} render={<Link href="/gear" />}>
          All Gear Shops
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {shops.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No listed gear shops in {region} yet. Check the{" "}
          <Link href="/gear" className="text-primary underline-offset-4 hover:underline">
            gear rental directory
          </Link>{" "}
          for nearby regions.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {shops.map((shop, i) => (
            <motion.li
              key={shop.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
              className="rounded-xl border border-border bg-card p-5"
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

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{shop.desc}</p>

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
        </ul>
      )}
    </div>
  )
}
