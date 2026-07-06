"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Mountain, ArrowUpDown } from "lucide-react"
import { getAllTreks, getTrekSlug, DIFFICULTY_META, type Trek } from "@/lib/data"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuthGuard } from "@/hooks/use-auth-guard"

function matchesQuery(trek: Trek, q: string) {
  const hay = `${trek.name} ${trek.state} ${trek.region ?? ""} ${trek.district ?? ""} ${trek.baseCamp ?? ""} ${trek.description}`.toLowerCase()
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((term) => hay.includes(term))
}

function scoreRelevance(trek: Trek, q: string): number {
  const lower = q.toLowerCase()
  let score = 0
  if (trek.name.toLowerCase().includes(lower)) score += 10
  if (trek.name.toLowerCase().startsWith(lower)) score += 20
  if ((trek.region ?? "").toLowerCase().includes(lower)) score += 5
  if (trek.state.toLowerCase().includes(lower)) score += 4
  if ((trek.district ?? "").toLowerCase().includes(lower)) score += 3
  if ((trek.baseCamp ?? "").toLowerCase().includes(lower)) score += 2
  if (trek.description.toLowerCase().includes(lower)) score += 1
  return score
}

function TrekSearchRow({
  trek,
  index,
  selectedIndex,
  onSelect,
}: {
  trek: Trek
  index: number
  selectedIndex: number
  onSelect: (slug: string) => void
}) {
  const slug = getTrekSlug(trek)
  const diffMeta = DIFFICULTY_META[trek.difficulty]
  const location = [trek.region, trek.state].filter(Boolean).join(" · ")

  return (
    <button
      type="button"
      role="option"
      aria-selected={index === selectedIndex}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        index === selectedIndex
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-accent",
      )}
      onClick={() => onSelect(slug)}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-md"
        style={{
          background: `linear-gradient(135deg, ${trek.color1}, ${trek.color2})`,
        }}
      >
        <Mountain className="size-4 text-white/90" aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium leading-tight">{trek.name}</span>
        <span className="truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {location}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border border-current/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
          diffMeta.className,
        )}
      >
        {diffMeta.label}
      </span>
    </button>
  )
}

export function TrekSearch({
  trigger,
}: {
  trigger?: React.ReactElement
}) {
  const router = useRouter()
  const { requireAuth } = useAuthGuard()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const allTreks = useMemo(() => getAllTreks(), [])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim()
    return allTreks
      .filter((t) => matchesQuery(t, q))
      .map((t) => ({ trek: t, score: scoreRelevance(t, q) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((r) => r.trek)
  }, [query, allTreks])

  const handleSelect = useCallback(
    (slug: string) => {
      setOpen(false)
      setQuery("")
      router.push(`/treks/${slug}`)
    },
    [router],
  )

  useEffect(() => {
    if (!open) {
      setQuery("")
      setSelectedIndex(0)
    } else {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (requireAuth()) {
          setOpen((o) => !o)
        }
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [requireAuth])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(getTrekSlug(results[selectedIndex]))
    }
  }

  const defaultTrigger = (
    <button
      type="button"
      aria-label="Search treks"
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Search className="size-4" aria-hidden="true" />
    </button>
  )

  function handleOpenChange(value: boolean) {
    if (value && !requireAuth()) {
      return
    }
    setOpen(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent
        showCloseButton={false}
        className="top-[15%] max-w-lg -translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search treks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            aria-label="Search treks"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex items-center gap-0.5">
            <ArrowUpDown className="size-3" aria-hidden="true" />
            <span className="text-[9px]">K</span>
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {query.trim() && results.length === 0 && (
            <p className="px-3 py-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No treks found
            </p>
          )}
          {results.map((trek, i) => (
            <TrekSearchRow
              key={trek.id}
              trek={trek}
              index={i}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
