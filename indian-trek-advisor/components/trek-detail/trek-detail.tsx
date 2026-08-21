"use client"

import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  FileCheck,
  Image as ImageIcon,
  Map,
  MapPin,
  Route,
  ScrollText,
  Tent,
  TrendingUp,
  Users,
  Bookmark,
  BookmarkCheck,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import type { Trek, MapWaypoint } from "@/lib/data"
import { DIFFICULTY_META } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { OverviewTab } from "./overview-tab"
import { ItineraryTab } from "./itinerary-tab"
import { PermitsTab } from "./permits-tab"
import { RouteMapTab } from "./route-map-tab"
import { GuidesTab } from "./guides-tab"
import { PhotosTab } from "./photos-tab"
import { GearTab } from "./gear-tab"

const TABS = [
  { id: "overview", label: "Overview", icon: ScrollText },
  { id: "itinerary", label: "Itinerary", icon: Route },
  { id: "permits", label: "Permits", icon: FileCheck },
  { id: "map", label: "Route Map", icon: Map },
  { id: "guides", label: "Local Guides", icon: Users },
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "gear", label: "Gear Rental", icon: Tent },
] as const

type TabId = (typeof TABS)[number]["id"]

interface NavRef {
  name: string
  slug: string
}

export function TrekDetail({
  trek,
  mapData,
  prev,
  next,
}: {
  trek: Trek
  mapData: MapWaypoint[] | null
  prev: NavRef
  next: NavRef
}) {
  const [tab, setTab] = useState<TabId>("overview")
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<string | null>(null)
  const diff = DIFFICULTY_META[trek.difficulty]
  const tabsNavRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const isTrekker = accountType === "trekker"

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => setAccountType(profile?.account_type ?? null))
    })
  }, [supabase])

  useEffect(() => {
    async function checkIfSaved() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: trekker, error: trekkerErr } = await supabase
          .from("trekkers")
          .select("saved_treks")
          .eq("user_id", user.id)
          .maybeSingle()
        if (trekkerErr) {
          console.error("Error checking saved trek:", trekkerErr)
          return
        }
        if (trekker?.saved_treks?.includes(trek.name)) {
          setIsSaved(true)
        }
      }
    }
    checkIfSaved()
  }, [trek.name, supabase])

  async function toggleSaveTrek() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Please sign in to save treks")
        setLoading(false)
        return
      }

      const { data: trekker, error: trekkerErr } = await supabase
        .from("trekkers")
        .select("saved_treks")
        .eq("user_id", user.id)
        .maybeSingle()

      if (trekkerErr) {
        console.error("Error loading saved treks:", trekkerErr)
        setLoading(false)
        return
      }
      const currentSaved = trekker?.saved_treks || []
      const newSaved = isSaved
        ? currentSaved.filter((t: string) => t !== trek.name)
        : [...currentSaved, trek.name]

      const { error } = await supabase
        .from("trekkers")
        .update({ saved_treks: newSaved })
        .eq("user_id", user.id)

      if (!error) {
        setIsSaved(!isSaved)
      }
    } catch (err) {
      console.error("Error saving trek:", err)
    }
    setLoading(false)
  }

  function goToTab(id: TabId) {
    setTab(id)
    tabsNavRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab")
    if (requested && TABS.some((t) => t.id === requested)) {
      setTab(requested as TabId)
      // Deep-linked to a non-default tab (e.g. from /guide/find) — the hero
      // banner is tall enough that the tab content would otherwise be
      // entirely off-screen with no indication it's already selected.
      tabsNavRef.current?.scrollIntoView({ block: "start" })
    }
  }, [])

  return (
    <main className="overflow-x-clip pt-16">
      {/* ---- Banner ---- */}
      <section
        className="relative overflow-hidden"
        style={{
          background: trek.coverImage 
            ? `url(${trek.coverImage}) center/cover no-repeat`
            : `linear-gradient(135deg, ${trek.color1} 0%, ${trek.color2} 100%)`,
        }}
      >
        {/* topo-style decorative rings */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 size-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-2 size-48 rounded-full border border-white/10"
        />
        {/* peak silhouette */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full opacity-20"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,200 L150,80 L250,140 L400,30 L520,120 L680,50 L800,130 L950,60 L1080,140 L1200,90 L1200,200 Z"
            fill="black"
          />
        </svg>
        <div className={`absolute inset-0 ${trek.coverImage ? 'bg-gradient-to-t from-black/70 via-black/30 to-black/20' : 'bg-gradient-to-t from-black/50 via-transparent to-black/20'}`} aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <BackButton light className="mb-4 md:mb-6" />

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 font-mono text-[11px] uppercase tracking-wider backdrop-blur-sm ${diff.className}`}
              >
                <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                {diff.label}
              </span>
              {trek.permitRequired && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 font-mono text-xs uppercase tracking-wider text-white/90 backdrop-blur-sm">
                  <FileCheck className="size-3" aria-hidden="true" />
                  Permit Required
                </span>
              )}
              {trek.category && (
                <span className="inline-flex items-center rounded-full bg-black/40 px-3 py-1 font-mono text-xs uppercase tracking-wider text-amber-200 backdrop-blur-sm">
                  {trek.category === "kailash_yatra" ? "Kailash Yatra" : "Panch Kedar"}
                </span>
              )}
            </div>

            <h1 className="mt-3 max-w-3xl text-balance font-sans text-3xl font-bold tracking-tight text-white md:text-6xl">
              {trek.name}
            </h1>

            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-white/80 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {[...new Set([trek.region, trek.state].filter(Boolean))].join(", ")}
              </span>
              {trek.baseCamp && (
                <span className="inline-flex items-center gap-1.5">
                  <Tent className="size-3.5" aria-hidden="true" />
                  Base: {trek.baseCamp}
                </span>
              )}
            </p>

            <dl className="mt-4 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
              {[
                {
                  icon: Clock,
                  label: "Duration",
                  value: `${trek.days} ${trek.durationType === "hours" ? "hrs" : "days"}`,
                },
                {
                  icon: Route,
                  label: "Distance",
                  value: /km|way|trip/i.test(String(trek.distance))
                    ? String(trek.distance)
                    : `${trek.distance} km`,
                },
                {
                  icon: TrendingUp,
                  label: "Max Elevation",
                  value: trek.elevationStr ?? `${trek.elevation.toLocaleString()}m`,
                },
                { icon: Calendar, label: "Best Season", value: trek.bestSeason ?? "Year-round" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg bg-black/30 px-3 py-2 backdrop-blur-sm"
                >
                  <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/60 sm:text-xs">
                    <stat.icon className="size-3" aria-hidden="true" />
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 truncate font-mono text-sm font-semibold text-white" title={String(stat.value)}>
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
              {accountType !== "guide" && accountType !== "admin" && (
                <Button
                  className="rounded-full bg-white text-gray-950 hover:bg-white/90"
                  onClick={() => goToTab("guides")}
                >
                  <Users className="size-4" aria-hidden="true" />
                  Book a Guide
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => setTab("itinerary")}
              >
                <Route className="size-4" aria-hidden="true" />
                View Itinerary
              </Button>
              {accountType !== "guide" && accountType !== "admin" && (
                <Button
                  variant="outline"
                  className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={toggleSaveTrek}
                  disabled={loading}
                >
                  {isSaved ? (
                    <BookmarkCheck className="size-4" aria-hidden="true" />
                  ) : (
                    <Bookmark className="size-4" aria-hidden="true" />
                  )}
                  {isSaved ? "Saved" : "Save Trek"}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---- Tabs ---- */}
      <div ref={tabsNavRef} className="border-b border-border bg-background/90 backdrop-blur-md md:sticky md:top-16 md:z-30">
        <nav
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 md:px-6"
          aria-label="Trek sections"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`relative flex shrink-0 items-center gap-1.5 px-3 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors sm:gap-2 sm:px-4 md:py-3.5 md:text-xs ${
                tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="size-3.5 shrink-0" aria-hidden="true" />
              {t.label}
              {tab === t.id && (
                <motion.span
                  layoutId="trek-tab-indicator"
                  className="absolute inset-x-2 bottom-0 h-0.5 bg-primary"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ---- Tab content ---- */}
      <div className="mx-auto min-w-0 max-w-6xl overflow-x-clip px-4 py-8 md:px-6 md:py-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {tab === "overview" && <OverviewTab trek={trek} />}
            {tab === "itinerary" && <ItineraryTab trek={trek} />}
            {tab === "permits" && <PermitsTab trek={trek} />}
            {tab === "map" && <RouteMapTab trek={trek} waypoints={mapData} />}
            {tab === "guides" && <GuidesTab trek={trek} />}
            {tab === "photos" && <PhotosTab />}
            {tab === "gear" && <GearTab trek={trek} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---- Prev / Next ---- */}
      <nav
        className="border-t border-border"
        aria-label="Trek navigation"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border">
          <Link
            href={`/treks/${prev.slug}`}
            className="group flex items-center gap-3 px-4 py-6 transition-colors hover:bg-secondary/50 md:px-6"
          >
            <ArrowLeft
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Previous Trek
              </p>
              <p className="truncate text-sm font-semibold text-foreground">{prev.name}</p>
            </div>
          </Link>
          <Link
            href={`/treks/${next.slug}`}
            className="group flex items-center justify-end gap-3 px-4 py-6 text-right transition-colors hover:bg-secondary/50 md:px-6"
          >
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Next Trek
              </p>
              <p className="truncate text-sm font-semibold text-foreground">{next.name}</p>
            </div>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </nav>

    </main>
  )
}
