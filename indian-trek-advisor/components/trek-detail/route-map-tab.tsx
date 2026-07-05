"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Tent, TrendingUp } from "lucide-react"
import type { Trek, MapWaypoint } from "@/lib/data"

const W = 900
const H = 340
const PAD = { top: 30, right: 30, bottom: 46, left: 56 }

export function RouteMapTab({
  trek,
  waypoints,
}: {
  trek: Trek
  waypoints: MapWaypoint[] | null
}) {
  const [active, setActive] = useState<number | null>(null)

  const chart = useMemo(() => {
    if (!waypoints || waypoints.length < 2) return null
    const maxDist = Math.max(...waypoints.map((w) => w.dist))
    const elvs = waypoints.map((w) => w.elv)
    const minElv = Math.min(...elvs)
    const maxElv = Math.max(...elvs)
    const elvRange = Math.max(maxElv - minElv, 1)

    const x = (d: number) =>
      PAD.left + (d / Math.max(maxDist, 1)) * (W - PAD.left - PAD.right)
    const y = (e: number) =>
      PAD.top + (1 - (e - minElv) / elvRange) * (H - PAD.top - PAD.bottom)

    const points = waypoints.map((w) => ({ ...w, x: x(w.dist), y: y(w.elv) }))

    // Smooth-ish path via straight segments (terrain honesty)
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
    const area = `${line} L${points[points.length - 1].x},${H - PAD.bottom} L${points[0].x},${H - PAD.bottom} Z`

    // Elevation grid lines (4 steps)
    const gridLines = Array.from({ length: 4 }, (_, i) => {
      const e = minElv + (elvRange * (i + 1)) / 4
      return { y: y(e), label: `${Math.round(e).toLocaleString()}m` }
    })

    return { points, line, area, gridLines, minElv, maxElv, maxDist }
  }, [waypoints])

  if (!chart) {
    return (
      <p className="text-sm text-muted-foreground">
        Route elevation data coming soon for this trail.
      </p>
    )
  }

  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
        Elevation Profile
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {trek.name} — {chart.maxDist} km route from {chart.points[0].label} (
        {chart.points[0].elv.toLocaleString()}m) up to{" "}
        {chart.maxElv.toLocaleString()}m. Hover or tap waypoints for details. Tent icons mark
        overnight camps.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 overflow-x-auto rounded-xl border border-border bg-card p-4"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label={`Elevation profile chart for ${trek.name}`}
        >
          {/* grid */}
          {chart.gridLines.map((g) => (
            <g key={g.y}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={g.y}
                y2={g.y}
                stroke="currentColor"
                className="text-border"
                strokeDasharray="4 6"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={g.y + 3}
                textAnchor="end"
                className="fill-muted-foreground font-mono"
                fontSize="10"
              >
                {g.label}
              </text>
            </g>
          ))}

          {/* area fill */}
          <path d={chart.area} fill={trek.accent} opacity="0.12" />
          {/* elevation line */}
          <motion.path
            d={chart.line}
            fill="none"
            stroke={trek.accent}
            strokeWidth="2.5"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />

          {/* waypoints */}
          {chart.points.map((p, i) => (
            <g key={`${p.label}-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={active === i ? 7 : 5}
                fill={p.camp ? trek.accent : "var(--color-card)"}
                stroke={trek.accent}
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(active === i ? null : i)}
                tabIndex={0}
                role="button"
                aria-label={`${p.label}, ${p.elv.toLocaleString()} metres at ${p.dist} km${p.camp ? ", overnight camp" : ""}`}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
              {/* distance labels along bottom */}
              <text
                x={p.x}
                y={H - PAD.bottom + 18}
                textAnchor="middle"
                className="fill-muted-foreground font-mono"
                fontSize="9"
              >
                {p.dist}km
              </text>

              {/* tooltip */}
              {active === i && (
                <g pointerEvents="none">
                  <rect
                    x={Math.min(Math.max(p.x - 80, PAD.left), W - PAD.right - 160)}
                    y={Math.max(p.y - 64, 4)}
                    width="160"
                    height="48"
                    rx="8"
                    fill="var(--color-popover)"
                    stroke="var(--color-border)"
                  />
                  <text
                    x={Math.min(Math.max(p.x - 80, PAD.left), W - PAD.right - 160) + 12}
                    y={Math.max(p.y - 64, 4) + 20}
                    className="fill-foreground font-mono"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {p.label.length > 22 ? `${p.label.slice(0, 21)}…` : p.label}
                  </text>
                  <text
                    x={Math.min(Math.max(p.x - 80, PAD.left), W - PAD.right - 160) + 12}
                    y={Math.max(p.y - 64, 4) + 36}
                    className="fill-muted-foreground font-mono"
                    fontSize="10"
                  >
                    {p.elv.toLocaleString()}m · {p.dist}km{p.camp ? " · camp" : ""}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </motion.div>

      {/* waypoint legend list */}
      <ol className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {chart.points.map((p, i) => (
          <li
            key={`${p.label}-legend-${i}`}
            className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
              active === i ? "border-primary/50 bg-primary/5" : "border-border bg-card"
            }`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            {p.camp ? (
              <Tent className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <TrendingUp className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1 truncate text-foreground">{p.label}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {p.elv.toLocaleString()}m
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
