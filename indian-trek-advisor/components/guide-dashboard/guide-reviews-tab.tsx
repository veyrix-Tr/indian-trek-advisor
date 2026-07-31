"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MessageSquare, User } from "lucide-react"

interface Review {
  id: string
  rating: number
  review_text?: string
  created_at: string
  trekker?: { name: string }
  guides?: { trek_name: string }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`size-4 ${
            s <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted/30 text-muted/30"
          }`}
        />
      ))}
    </div>
  )
}

export function GuideReviewsTab({ reviews }: { reviews: Review[] }) {
  const total = reviews.length
  const avgRating = total > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
    : 0

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))
  const maxCount = Math.max(...distribution.map((d) => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="flex items-center gap-6 p-6">
            <div className="text-center">
              <p className="font-mono text-4xl font-bold text-yellow-400">
                {avgRating.toFixed(1)}
              </p>
              <StarRating rating={Math.round(avgRating)} />
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {total} {total === 1 ? "review" : "reviews"}
              </p>
            </div>
            <div className="flex-1 space-y-1.5">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="w-3 text-right font-mono text-xs text-muted-foreground">
                    {d.star}
                  </span>
                  <Star className="size-3 fill-yellow-400 text-yellow-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                    <div
                      className="h-full rounded-full bg-yellow-400/60 transition-all duration-500"
                      style={{ width: `${(d.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right font-mono text-[10px] text-muted-foreground">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="size-7 text-primary" />
            </div>
            <p className="mt-3 font-mono text-2xl font-bold">{total}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Total Reviews
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {total === 0
                ? "Complete treks to receive reviews"
                : `From ${reviews.filter((r) => r.trekker?.name).length} trekkers`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="size-4 text-primary" />
            All Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {reviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No reviews yet. Complete treks to receive feedback.
              </p>
            ) : (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  variants={item}
                  className="rounded-xl border border-border/40 bg-background/40 p-4 transition-colors hover:bg-background/60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white">
                        {review.trekker?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {review.trekker?.name || "Anonymous"}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {review.guides?.trek_name || "Trek"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating rating={review.rating} />
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {review.review_text && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {review.review_text}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
