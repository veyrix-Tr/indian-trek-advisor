"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Clock, Route, TrendingUp } from "lucide-react"
import { type Trek, getTrekSlug, DIFFICULTY_META } from "@/lib/data"

/**
 * Trek card art: gradient built from the trek's own colors with a grain layer
 * and a peak silhouette. If a real photo exists at /treks/[slug].jpg it is
 * shown instead automatically (drop-in convention, no code changes needed).
 */
export function TrekArt({
  trek,
  className,
}: {
  trek: Trek
  className?: string
}) {
  const [photoState, setPhotoState] = useState<"loading" | "loaded" | "missing">("loading")
  const slug = getTrekSlug(trek)

  return (
    <div
      className={`grain relative overflow-hidden ${className ?? ""}`}
      style={{
        background: `linear-gradient(150deg, ${trek.color1} 0%, ${trek.color2} 100%)`,
      }}
    >
      {photoState !== "missing" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/treks/${slug}.jpg`}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${
            photoState === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setPhotoState("loaded")}
          onError={() => setPhotoState("missing")}
        />
      )}
      {photoState !== "loaded" && (
        <svg
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-2/3 w-full"
          viewBox="0 0 400 160"
          preserveAspectRatio="none"
        >
          <path
            d="M0 160 L70 60 L120 110 L190 30 L250 100 L310 55 L360 95 L400 45 L400 160 Z"
            fill="rgba(0,0,0,0.28)"
          />
          <path
            d="M0 160 L50 110 L110 140 L170 85 L240 135 L300 100 L400 130 L400 160 Z"
            fill="rgba(0,0,0,0.42)"
          />
        </svg>
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${trek.accent}26 0%, transparent 55%)`,
        }}
      />
    </div>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: Trek["difficulty"] }) {
  const meta = DIFFICULTY_META[difficulty]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-current/25 bg-background/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm ${meta.className}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function TrekCard({ trek, index = 0 }: { trek: Trek; index?: number }) {
  const slug = getTrekSlug(trek)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: Math.min(index % 6, 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <Link
        href={`/treks/${slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/35 hover:shadow-[0_16px_44px_-16px_rgba(0,0,0,0.65)]"
      >
        <div className="relative">
          <TrekArt
            trek={trek}
            className="aspect-[16/10] transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute left-3 top-3">
            <DifficultyBadge difficulty={trek.difficulty} />
          </div>
          {trek.permitRequired && (
            <span className="absolute right-3 top-3 rounded-full bg-background/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-foreground/90 backdrop-blur-sm">
              Permit
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-balance text-lg font-bold leading-snug transition-colors group-hover:text-primary">
              {trek.name}
            </h3>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {[...new Set([trek.region, trek.state].filter(Boolean))].join(" \u00B7 ")}
            </p>
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {trek.description}
          </p>

          <dl className="mt-auto flex items-center gap-4 border-t border-border pt-3.5 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary/70" aria-hidden="true" />
              <dt className="sr-only">Duration</dt>
              <dd>
                {trek.days}{" "}
                {trek.durationType === "hours" ? "hrs" : String(trek.days) === "1" ? "day" : "days"}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Route className="size-3.5 text-primary/70" aria-hidden="true" />
              <dt className="sr-only">Distance</dt>
              <dd>{/km|way|trip/i.test(String(trek.distance)) ? trek.distance : `${trek.distance} km`}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-primary/70" aria-hidden="true" />
              <dt className="sr-only">Elevation</dt>
              <dd>{trek.elevationStr ?? `${trek.elevation.toLocaleString()} m`}</dd>
            </div>
          </dl>
        </div>
      </Link>
    </motion.article>
  )
}
