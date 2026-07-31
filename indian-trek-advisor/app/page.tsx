import Link from "next/link"
import { Suspense } from "react"
import { Tent, ArrowRight } from "lucide-react"
import { HeroSection } from "@/components/hero/hero-content"
import { StatsStrip } from "@/components/stats-strip"
import { TrekCard } from "@/components/trek-card"
import { SectionHeading, BandLink } from "@/components/section-band"
import { GearTeaserLink } from "@/components/gear-teaser-link"
import { AuthRequiredHandler } from "@/components/auth-required-handler"
import { RoleGuard } from "@/components/role-guard"
import {
  getFeaturedTreks,
  getKailashTreks,
  getPanchKedarTreks,
  getTrekStats,
} from "@/lib/data"

export default function HomePage() {
  const stats = getTrekStats()
  const featured = getFeaturedTreks()
  const kailash = getKailashTreks().slice(0, 3)
  const panchKedar = getPanchKedarTreks().slice(0, 3)

  return (
    <main>
      <Suspense fallback={null}>
        <AuthRequiredHandler />
      </Suspense>
      <HeroSection />

      <StatsStrip
        stats={[
          { value: stats.total, label: "Trails", href: "/treks" },
          { value: stats.uttarakhand, label: "Uttarakhand", href: "/treks?q=Uttarakhand" },
          { value: stats.himachal, label: "Himachal", href: "/treks?q=Himachal" },
          { value: stats.jammuLadakh, label: "J&K / Ladakh", href: "/treks?q=Kashmir" },
          { value: stats.other, label: "Other States", href: "/treks" },
        ]}
      />

      {/* Featured treks */}
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 md:px-6 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Featured"
            title="Most Popular Treks"
            description="The trails trekkers ask about most — snow summits, alpine lakes and high passes with complete permit info and day-by-day itineraries."
          />
          <BandLink href="/treks" label={`View All ${stats.total} Treks`} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((trek, i) => (
            <TrekCard key={trek.id} trek={trek} index={i} />
          ))}
        </div>
      </section>

      {/* Kailash Yatra band */}
      <RoleGuard hideFor={["guide"]}>
        <section className="border-y border-border bg-card/40">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 md:px-6 md:py-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Sacred Circuits"
                title="Kailash Yatra"
                description="The great pilgrimage circuits — Adi Kailash, Om Parvat and the sacred Kailash routes, with permits, itineraries and acclimatisation guidance."
              />
              <BandLink href="/treks?section=kailash" label="Explore the Circuit" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {kailash.map((trek, i) => (
                <TrekCard key={trek.id} trek={trek} index={i} />
              ))}
            </div>
          </div>
        </section>
      </RoleGuard>

      {/* Panch Kedar band */}
      <RoleGuard hideFor={["guide"]}>
        <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 md:px-6 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Five Temples of Shiva"
              title="Panch Kedar Yatra"
              description="Kedarnath, Tungnath, Rudranath, Madhyamaheshwar and Kalpeshwar — the five sacred Kedar shrines, each reached on foot through Garhwal's high country."
            />
            <BandLink href="/treks?section=panch-kedar" label="Walk the Five Kedars" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {panchKedar.map((trek, i) => (
              <TrekCard key={trek.id} trek={trek} index={i} />
            ))}
          </div>
        </section>
      </RoleGuard>

      {/* Gear rental teaser */}
      <RoleGuard hideFor={["guide"]}>
        <section className="border-t border-border bg-card/40">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-20 md:flex-row md:items-center md:justify-between md:px-6 md:py-24">
            <div className="flex items-start gap-5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                <Tent className="size-7" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
                  Rent gear near your trailhead
                </h2>
                <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
                  Tents, sleeping bags, crampons and more from local rental shops
                  in Sankri, Manali, Leh and beyond — travel light, gear up at
                  base camp.
                </p>
              </div>
            </div>
            <GearTeaserLink />
          </div>
        </section>
      </RoleGuard>
    </main>
  )
}
