"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, SlidersHorizontal, X, Mountain, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TrekCard } from "@/components/trek-card"
import {
  type Trek,
  type Difficulty,
  DIFFICULTY_META,
  getAllTreks,
  getAllStates,
  getKailashTreks,
  getPanchKedarTreks,
} from "@/lib/data"

const SECTIONS = [
  { key: "all", label: "All Treks" },
  { key: "kailash", label: "Kailash Yatra" },
  { key: "panch-kedar", label: "Panch Kedar" },
] as const

const DIFFICULTIES: Difficulty[] = ["easy", "moderate", "hard", "expert"]

const MAX_DAYS = 16

const DAY_PRESETS = [
  { label: "Up to 2", min: 1, max: 2 },
  { label: "3–4", min: 3, max: 4 },
  { label: "5–7", min: 5, max: 7 },
  { label: "8–10", min: 8, max: 10 },
  { label: "11+", min: 11, max: MAX_DAYS },
]

// All states that actually have treks in the catalog (derived from the data,
// so the filter always matches the current trek list).
const ALL_STATES = getAllStates()

function matchesQuery(trek: Trek, q: string) {
  const hay = `${trek.name} ${trek.state} ${trek.region ?? ""} ${trek.district ?? ""} ${trek.baseCamp ?? ""}`.toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term))
}

function trekDays(trek: Trek): number {
  if (trek.durationType === "hours") return 1
  const parsed = String(trek.days).match(/\d+/g)
  if (!parsed) return 1
  return Math.max(...parsed.map(Number))
}

function FilterPanel({
  activeDifficulties,
  toggleDifficulty,
  activeStates,
  toggleState,
  daysRange,
  setDaysRange,
  reset,
  hasActiveFilters,
}: {
  activeDifficulties: Difficulty[]
  toggleDifficulty: (d: Difficulty) => void
  activeStates: string[]
  toggleState: (s: string) => void
  daysRange: [number, number]
  setDaysRange: (r: [number, number]) => void
  reset: () => void
  hasActiveFilters: boolean
}) {
  return (
    <div className="flex flex-col gap-7">
      <fieldset>
        <legend className="mb-3 font-mono text-[12px] uppercase tracking-widest text-foreground/70">
          Difficulty
        </legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => {
            const active = activeDifficulties.includes(d)
            const meta = DIFFICULTY_META[d]
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDifficulty(d)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                  active
                    ? `border-current/40 bg-current/10 ${meta.className}`
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${active ? "bg-current" : "bg-muted-foreground/50"}`}
                  aria-hidden="true"
                />
                {meta.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-widest text-foreground/70">
          <MapPin className="size-3.5" aria-hidden="true" />
          State
        </legend>
        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
          {ALL_STATES.map((s) => {
            const active = activeStates.includes(s)
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => toggleState(s)}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground/70 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-mono text-[12px] uppercase tracking-widest text-foreground/70">
          Duration
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
          {DAY_PRESETS.map((p) => {
            const active = daysRange[0] === p.min && daysRange[1] === p.max
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() => setDaysRange([p.min, Math.min(p.max, MAX_DAYS)])}
                className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground/70 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <span className="block font-mono text-[11px] font-medium">{p.label}</span>
                <span className="block text-[10px] text-foreground/50">
                  {p.min === p.max ? `${p.min}` : `${p.min}–${p.max === 16 ? "16+" : p.max}`} days
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="gap-1.5 self-start font-mono text-xs uppercase tracking-wider"
        >
          <X className="size-3.5" aria-hidden="true" />
          Reset filters
        </Button>
      )}
    </div>
  )
}

export function TreksBrowser() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const section = (searchParams.get("section") ?? "all") as
    | "all"
    | "kailash"
    | "panch-kedar"
  const query = searchParams.get("q") ?? ""
  const activeDifficulties: Difficulty[] = (searchParams.get("difficulty") ?? "")
    .split(",")
    .filter((d): d is Difficulty => DIFFICULTIES.includes(d as Difficulty))
  const activeStates: string[] = (searchParams.get("state") ?? "")
    .split(",")
    .filter((s) => ALL_STATES.includes(s))
  const minDays = Number(searchParams.get("minDays")) || 1
  const maxDays = Number(searchParams.get("maxDays")) || MAX_DAYS
  const daysRange: [number, number] = [Math.max(1, minDays), Math.min(MAX_DAYS, maxDays)]

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Keep local search value in sync when URL changes (back/forward)
  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "")
  }, [searchParams])

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === "" || value === "all") params.delete(key)
      else params.set(key, value)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const toggleDifficulty = useCallback(
    (d: Difficulty) => {
      const next = activeDifficulties.includes(d) ? [] : [d]
      setParam("difficulty", next.length > 0 ? next.join(",") : null)
    },
    [activeDifficulties, setParam],
  )

  const setDaysRange = useCallback(
    (range: [number, number]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (range[0] > 1) params.set("minDays", String(range[0]))
      else params.delete("minDays")
      if (range[1] < MAX_DAYS) params.set("maxDays", String(range[1]))
      else params.delete("maxDays")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const toggleState = useCallback(
    (s: string) => {
      const next = activeStates.includes(s) ? [] : [s]
      setParam("state", next.length > 0 ? next.join(",") : null)
    },
    [activeStates, setParam],
  )

  const hasActiveFilters =
    activeDifficulties.length > 0 ||
    activeStates.length > 0 ||
    daysRange[0] !== 1 ||
    daysRange[1] !== MAX_DAYS

  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("difficulty")
    params.delete("minDays")
    params.delete("maxDays")
    params.delete("state")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const sectionTreks = useMemo(() => {
    if (section === "kailash") return getKailashTreks()
    if (section === "panch-kedar") return getPanchKedarTreks()
    return getAllTreks()
  }, [section])

  const filtered = useMemo(() => {
    return sectionTreks.filter((t) => {
      if (query && !matchesQuery(t, query)) return false
      if (
        activeDifficulties.length > 0 &&
        !activeDifficulties.includes(t.difficulty)
      )
        return false
      if (activeStates.length > 0 && !activeStates.includes(t.state)) return false
      const days = trekDays(t)
      if (days < daysRange[0]) return false
      if (daysRange[1] !== MAX_DAYS && days > daysRange[1]) return false
      return true
    })
  }, [sectionTreks, query, activeDifficulties, activeStates, daysRange])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-24 pt-28 md:px-6">
      <header className="flex flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
            {"\u25B2"} The Catalog
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {section === "kailash"
              ? "Kailash Yatra Circuits"
              : section === "panch-kedar"
                ? "Panch Kedar Yatra"
                : "Every Trail. Every Detail."}
          </h1>
        </motion.div>

        <nav aria-label="Trek sections" className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={section === s.key}
              onClick={() => setParam("section", s.key)}
              className={`rounded-full border px-4 py-2 font-mono text-sm uppercase tracking-widest transition-colors ${
                section === s.key
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-foreground/70 hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchValue}
              placeholder="Search by name, state, region, base camp..."
              aria-label="Search treks"
              className="h-11 rounded-full pl-10"
              onChange={(e) => {
                setSearchValue(e.target.value)
                setParam("q", e.target.value)
              }}
            />
          </div>

          {/* Mobile filters */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className="gap-2 rounded-full lg:hidden"
                  aria-label="Open filters"
                >
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  Filters
                  {hasActiveFilters && (
                    <span
                      className="size-2 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              }
            />
            <SheetContent side="bottom" className="border-border bg-card pb-8">
              <SheetHeader>
                <SheetTitle>Filter treks</SheetTitle>
              </SheetHeader>
              <div className="px-4">
                <FilterPanel
                  activeDifficulties={activeDifficulties}
                  toggleDifficulty={toggleDifficulty}
                  activeStates={activeStates}
                  toggleState={toggleState}
                  daysRange={daysRange}
                  setDaysRange={setDaysRange}
                  reset={reset}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex gap-10">
        {/* Desktop sidebar */}
        <aside
          aria-label="Trek filters"
          className="sticky top-24 hidden h-fit w-60 shrink-0 rounded-2xl border border-border bg-card p-6 lg:block"
        >
          <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
            Filters
          </h2>
          <FilterPanel
            activeDifficulties={activeDifficulties}
            toggleDifficulty={toggleDifficulty}
            activeStates={activeStates}
            toggleState={toggleState}
            daysRange={daysRange}
            setDaysRange={setDaysRange}
            reset={reset}
            hasActiveFilters={hasActiveFilters}
          />
        </aside>

        <div className="flex-1">
          <p
            aria-live="polite"
            className="mb-5 font-mono text-sm uppercase tracking-widest text-foreground/70"
          >
            {filtered.length} {filtered.length === 1 ? "trail" : "trails"} found
          </p>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-24 text-center">
              <Mountain className="size-10 text-foreground/50" aria-hidden="true" />
              <p className="text-foreground/70">
                No treks match your filters. Try widening the search.
              </p>
              <Button variant="outline" size="sm" onClick={reset}>
                Reset filters
              </Button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((trek, i) => (
                  <TrekCard key={trek.id} trek={trek} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
