"use client"

import { useState, useMemo } from "react"
import { Star, MessageSquareQuote, Search } from "lucide-react"

interface AdminReview {
  id: string
  rating: number
  review: string | null
  created_at: string
  trekker?: { name: string }
  booking?: { trek_id: string; booking_date: string }
  guide?: {
    user_id: string
    profiles?: { name: string; id: string }
  }
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-3.5 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-border"}`}
        />
      ))}
    </span>
  )
}

export function AdminReviews({
  reviews,
  getGuideName,
}: {
  reviews: AdminReview[]
  getGuideName: (userId: string) => string | undefined
}) {
  const [search, setSearch] = useState("")

  const { total, average, filtered } = useMemo(() => {
    const total = reviews.length
    const average =
      total > 0 ? reviews.reduce((sum, r) => sum + Number(r.rating) || 0, 0) / total : 0
    const q = search.trim().toLowerCase()
    const filtered = q
      ? reviews.filter((r) => {
          const guideName = getGuideName(r.guide?.user_id ?? "")?.toLowerCase() || ""
          const trekkerName = r.trekker?.name?.toLowerCase() || ""
          const text = String(r.review || "").toLowerCase()
          return guideName.includes(q) || trekkerName.includes(q) || text.includes(q)
        })
      : reviews
    return { total, average, filtered }
  }, [reviews, search, getGuideName])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Reviews" value={String(total)} />
        <StatCard label="Average Rating" value={total > 0 ? average.toFixed(2) : "—"} />
        <StatCard label="Reviewing Guides" value={String(new Set(reviews.map((r) => r.guide?.user_id)).size)} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by guide, trekker, or review text…"
          className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-foreground/40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-16 text-center text-sm text-muted-foreground/60">
          No reviews found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const guideName = getGuideName(r.guide?.user_id ?? "") || r.guide?.profiles?.name || "Unknown guide"
            const trekInfo = r.booking
              ? r.booking.trek_id
                ? `Trek #${r.booking.trek_id}`
                : ""
              : ""
            return (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StarRow rating={r.rating} />
                    <span className="text-sm font-medium text-foreground">for {guideName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {r.review && (
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.review}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquareQuote className="size-3" />
                    {r.trekker?.name || "Anonymous trekker"}
                  </span>
                  {trekInfo && <span>{trekInfo}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}