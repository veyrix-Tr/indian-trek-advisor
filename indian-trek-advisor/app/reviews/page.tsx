"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft, Star, MessagesSquare, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"

interface Review {
  id: string
  rating: number
  review: string | null
  created_at: string
  bookings: {
    trek_id: string
    booking_date: string
  }
  guides: {
    profiles: {
      name: string
    }
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function ReviewsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace("/")
          return
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", user.id)
          .single()
        if (profile?.account_type === "guide") {
          router.replace("/guide/dashboard")
          return
        }
        const res = await fetch("/api/trekker/reviews")
        if (res.status === 401) {
          router.replace("/")
          return
        }
        const data = await res.json()
        if (active) setReviews(data.reviews || [])
      } catch {
        // ignore — show empty state
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent" />

      <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6 sm:pt-20">
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted/40 transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
              <ArrowLeft className="size-4" />
            </span>
            Back
          </button>

          <span className="font-mono text-[20px] uppercase tracking-[0.2em] text-muted-foreground/50">
            My Reviews
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card px-6 py-20 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessagesSquare className="size-7" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-bold">No reviews yet</h1>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Once you complete a trek you can rate your guide. Your reviews will appear
                here for you to look back on.
              </p>
            </div>
            <Button render={<a href="/treks" />} nativeButton={false} className="mt-2 gap-1.5">
              <Compass className="size-4" aria-hidden="true" />
              Browse Treks
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"} you&apos;ve
              submitted. The overall rating on each guide remains a blended average of all
              trekkers.
            </p>
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <motion.article
                  key={review.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="rounded-2xl border border-border/60 bg-card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-foreground">
                        {review.guides?.profiles?.name || "Guide"}
                      </h2>
                      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {review.bookings?.trek_id || "Trek"} ·{" "}
                        {review.bookings?.booking_date
                          ? formatDate(review.bookings.booking_date)
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`size-4 ${
                            s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                  {review.review ? (
                    <p className="mt-3 leading-relaxed text-sm text-muted-foreground">
                      {review.review}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm italic text-muted-foreground/60">
                      No written review — rating only.
                    </p>
                  )}
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    Submitted {formatDate(review.created_at)}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}