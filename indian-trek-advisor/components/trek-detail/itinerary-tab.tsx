"use client"

import { motion } from "framer-motion"
import { Clock, MapPin, Route, Tent, TrendingUp, Undo2 } from "lucide-react"
import type { Trek } from "@/lib/data"

export function ItineraryTab({ trek }: { trek: Trek }) {
  if (!trek.itinerary || trek.itinerary.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Day-by-day itinerary coming soon for this trail.
      </p>
    )
  }

  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
        Day-by-Day Itinerary
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {trek.itinerary.length} stages from base to summit and back. Return-journey days are
        marked.
      </p>

      <ol className="relative mt-8 space-y-6 border-l border-border pl-8 md:pl-10">
        {trek.itinerary.map((day, i) => {
          const isReturn = Boolean(day.returnJourney)
          return (
            <motion.li
              key={`${day.day}-${i}`}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative"
            >
              {/* timeline node */}
              <span
                aria-hidden="true"
                className={`absolute -left-[37px] top-1 flex size-6 items-center justify-center rounded-full border font-mono text-[10px] font-bold md:-left-[45px] ${
                  isReturn
                    ? "border-difficulty-moderate/50 bg-difficulty-moderate/10 text-difficulty-moderate"
                    : "border-primary/50 bg-primary/10 text-primary"
                }`}
              >
                {day.day}
              </span>

              <article
                className={`rounded-xl border bg-card p-5 ${
                  isReturn ? "border-difficulty-moderate/30" : "border-border"
                }`}
              >
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest ${
                      isReturn ? "text-difficulty-moderate" : "text-primary"
                    }`}
                  >
                    Day {day.day}
                    {isReturn && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <Undo2 className="size-3" aria-hidden="true" />
                        Return Journey
                      </span>
                    )}
                  </span>
                  <h3 className="w-full text-base font-semibold text-foreground md:w-auto">
                    {day.title}
                  </h3>
                </header>

                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-xs text-muted-foreground">
                  {day.distance && (
                    <div className="flex items-center gap-1.5">
                      <Route className="size-3 text-primary/60" aria-hidden="true" />
                      <dt className="sr-only">Distance</dt>
                      <dd>{day.distance}</dd>
                    </div>
                  )}
                  {day.elevation && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="size-3 text-primary/60" aria-hidden="true" />
                      <dt className="sr-only">Elevation</dt>
                      <dd>{day.elevation}</dd>
                    </div>
                  )}
                  {day.time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 text-primary/60" aria-hidden="true" />
                      <dt className="sr-only">Time</dt>
                      <dd>{day.time}</dd>
                    </div>
                  )}
                  {day.camp && (
                    <div className="flex items-center gap-1.5">
                      <Tent className="size-3 text-primary/60" aria-hidden="true" />
                      <dt className="sr-only">Camp</dt>
                      <dd>{day.camp}</dd>
                    </div>
                  )}
                </dl>

                {day.desc && (
                  <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {day.desc}
                  </p>
                )}
              </article>
            </motion.li>
          )
        })}
      </ol>

      <p className="mt-8 flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
        Itineraries are indicative. Actual pace depends on weather, acclimatisation, and group
        fitness. Always confirm current trail conditions with local guides before departure.
      </p>
    </div>
  )
}
