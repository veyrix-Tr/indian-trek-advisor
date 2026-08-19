"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { Trek, MapWaypoint } from "@/lib/data"

const W = 900
const H = 320
const PAD = { top: 54, right: 28, bottom: 40, left: 56 }
const CH = H - PAD.top - PAD.bottom

// Altitude bar-chart panel (mirrors the HTML's second canvas).
const BAR_H = 170
const BAR_PAD = { top: 16, right: 24, bottom: 34, left: 58 }
const BAR_CH = BAR_H - BAR_PAD.top - BAR_PAD.bottom

const fmtK = (e: number) => (e >= 1000 ? (e / 1000).toFixed(2) + "k" : String(e)) + "m"

interface Pt {
  label: string
  elv: number
  dist: number
  camp?: boolean
  cum: number
  x: number
  y: number
}

// Catmull-Rom spline → cubic Bézier so the curve passes EXACTLY through every
// waypoint (midpoint quadratics only passed near the points, leaving the dots
// floating slightly off the line).
function smoothPath(points: Pt[]) {
  if (points.length < 2) return ""
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

function buildOutbound(waypoints: MapWaypoint[] | null) {
  // HTML prototype plots only the OUTWARD route in the main altitude panels
  // (return-leg waypoints are ret:true). They're excluded so the line doesn't
  // double back into a messy shape.
  const outbound = (waypoints || []).filter((w) => !w.ret)
  if (outbound.length < 2) return null

  const elvs = outbound.map((w) => w.elv)
  const minElv = Math.min(...elvs)
  const maxElv = Math.max(...elvs)
  const elvRange = Math.max(maxElv - minElv, 1)

  const y = (e: number) => PAD.top + (1 - (e - minElv) / elvRange) * CH

  // x follows CUMULATIVE distance (HTML: xFrac = cum / totalDist).
  let cum = 0
  const pts = outbound.map((w) => {
    cum += w.dist
    return { ...w, cum }
  })
  const totalDist = cum || pts.length
  const points: Pt[] = pts.map((p, i) => ({
    ...p,
    x: PAD.left + (p.cum / totalDist) * (W - PAD.left - PAD.right),
    y: y(p.elv),
  }))

  // Zero-distance / duplicate-cumulative waypoints (rest days, "short
  // excursions" camps) land on the same x as their neighbour, which forces a
  // jarring 90° vertical spike. Enforce a minimum horizontal step so every
  // segment stays readable and the profile never goes perfectly vertical.
  const chartW = W - PAD.left - PAD.right
  const minStep = Math.min(Math.max(chartW * 0.015, 8), chartW / 15)
  for (let i = 1; i < points.length; i++) {
    const prevX = points[i - 1].x
    if (points[i].x - prevX < minStep) {
      points[i].x = Math.min(prevX + minStep, W - PAD.right)
    }
    // Also ensure we don't exceed the chart width
    if (points[i].x > W - PAD.right) {
      points[i].x = W - PAD.right
    }
  }

  const line = smoothPath(points)
  const areaBase = H - PAD.bottom
  const area = `${line} L${points[points.length - 1].x},${areaBase} L${points[0].x},${areaBase} Z`

  let gain = 0
  for (let i = 1; i < points.length; i++) {
    if (points[i].elv > points[i - 1].elv) gain += points[i].elv - points[i - 1].elv
  }

  // Grid lines: 4 steps below the peak (HTML draws 5 lines incl. bottom).
  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const e = minElv + (elvRange * (i + 1)) / 4
    return { y: y(e), label: fmtK(Math.round(e)) }
  })

  // Cumulative distance tick labels along the bottom.
  const distTicks = points
    .filter((p) => p.cum > 0)
    .map((p) => ({ value: p.cum, x: p.x }))

  return {
    points,
    line,
    area,
    gridLines,
    distTicks,
    minElv,
    maxElv,
    startElv: points[0].elv,
    totalDist,
    gain,
    startLabel: points[0].label,
    highP: points.reduce((a, b) => (b.elv > a.elv ? b : a), points[0]),
  }
}

function buildBars(prev: ReturnType<typeof buildOutbound>) {
  const pts = prev!.points
  const { minElv, maxElv } = prev!
  const elvRange = Math.max(maxElv - minElv, 1)
  const barW = prev!.points.length >= 2 ? (W - BAR_PAD.left - BAR_PAD.right) / pts.length : 0
  const bars = pts.map((p, i) => {
    const cx = BAR_PAD.left + (i + 0.5) * barW
    const frac = (p.elv - minElv) / elvRange
    const bh = Math.max(2, frac * BAR_CH)
    const by = BAR_PAD.top + BAR_CH - bh
    return { ...p, cx, by, bh, barW, isHigh: p.elv === maxElv }
  })
  const trend = bars.map((b) => `${b.cx},${b.by}`).join(" ")
  return { bars, barW, trend }
}

export function RouteMapTab({
  trek,
  waypoints,
}: {
  trek: Trek
  waypoints: MapWaypoint[] | null
}) {
  const [active, setActive] = useState<number | null>(null)

  const chart = useMemo(() => buildOutbound(waypoints), [waypoints])
  const bars = useMemo(() => (chart ? buildBars(chart) : null), [chart])

  if (!chart || !bars) {
    return (
      <p className="text-sm text-muted-foreground">
        Route elevation data coming soon for this trail.
      </p>
    )
  }

  const accent = trek.accent || "#5dbf7e"

  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
        Elevation Profile
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {trek.name} — {chart.totalDist} km outward route from {chart.startLabel} (
        {chart.startElv.toLocaleString()}m) reaching {chart.maxElv.toLocaleString()}m. Hover or
        tap a checkpoint for details. Tent icons mark overnight camps.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 overflow-x-auto rounded-xl border border-border bg-card p-4"
      >
        <div
          className="relative w-full min-w-[640px] cursor-crosshair"
          onMouseLeave={() => setActive(null)}
        >
          {/* ── MAIN ELEVATION PROFILE PANEL ── */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            role="img"
            aria-label={`Elevation profile chart for ${trek.name}`}
          >
            <defs>
              <linearGradient id="rm-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a2830" />
                <stop offset="100%" stopColor="#162028" />
              </linearGradient>
              <linearGradient id="rm-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
                <stop offset="0.6" stopColor={accent} stopOpacity="0.1" />
                <stop offset="1" stopColor={accent} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* background */}
            <rect width={W} height={H} fill="url(#rm-bg)" rx="10" />

            {/* grid lines */}
            {chart.gridLines.map((g) => (
              <g key={g.y}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={g.y}
                  y2={g.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 6}
                  y={g.y + 3}
                  textAnchor="end"
                  fontFamily="monospace"
                  fontSize="9"
                  fill="rgba(138,168,164,0.7)"
                >
                  {g.label}
                </text>
              </g>
            ))}
            <text
              x={14}
              y={PAD.top + CH / 2}
              transform={`rotate(-90 14 ${PAD.top + CH / 2})`}
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="8"
              fill="rgba(138,168,164,0.45)"
            >
              ELEVATION
            </text>

            {/* area fill + elevation line */}
            <path d={chart.area} fill="url(#rm-fill)" />
            <motion.path
              d={chart.line}
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />

            {/* cumulative distance ticks */}
            {chart.distTicks.map((t) => (
              <g key={t.x}>
                <line
                  x1={t.x}
                  x2={t.x}
                  y1={H - PAD.bottom}
                  y2={H - PAD.bottom + 3}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
                <text
                  x={t.x}
                  y={H - PAD.bottom + 12}
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="8"
                  fill="rgba(138,168,164,0.5)"
                >
                  {t.value}km
                </text>
              </g>
            ))}

            {/* checkpoints: dots always, name/elev label only on hover */}
            {chart.points.map((p, i) => {
              const isHigh = p === chart.highP
              const isActive = active === i
              const dotR = isHigh ? 5 : p.camp ? 4 : 3

              return (
                <g
                  key={`${p.label}-${i}`}
                  className="cursor-pointer"
                >
                  {/* generous invisible hit area so hovering near the point works */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    fill="transparent"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setActive(isActive ? null : i)}
                  />

                  {/* hover-only label anchored to the exact point */}
                  {isActive && (() => {
                    const tw = 148
                    const th = 30
                    const below = p.y < H - PAD.bottom - 70
                    let tx = p.x - tw / 2
                    tx = Math.min(Math.max(tx, 4), W - tw - 4)
                    const ty = below ? p.y + dotR + 10 : Math.max(4, p.y - dotR - 10 - th)
                    const anchor = { x: p.x, y: below ? p.y + dotR + 4 : p.y - dotR - 4 }
                    const tip = { x: Math.min(Math.max(p.x, tx + 20), tx + tw - 20), y: below ? ty : ty + th }
                    return (
                      <g pointerEvents="none">
                        <line
                          x1={anchor.x}
                          y1={anchor.y}
                          x2={tip.x}
                          y2={tip.y}
                          stroke={isHigh ? "rgba(240,165,0,0.7)" : "rgba(20,184,200,0.6)"}
                          strokeWidth="1.2"
                        />
                        <rect x={tx} y={ty} width={tw} height={th} rx="7" fill="rgba(18,26,32,0.97)" stroke={isHigh ? "rgba(240,165,0,0.6)" : "rgba(20,184,200,0.5)"} strokeWidth="1" />
                        <text x={tx + tw / 2} y={ty + 15} textAnchor="middle" fontFamily="monospace" fontWeight="bold" fontSize="10" fill={isHigh ? "#f0a500" : "#a8e6ee"}>
                          {p.label.length > 18 ? `${p.label.slice(0, 17)}…` : p.label}
                        </text>
                        <text x={tx + tw / 2} y={ty + 26} textAnchor="middle" fontFamily="monospace" fontSize="8" fill="rgba(180,210,215,0.85)">
                          {p.elv.toLocaleString()}m · {p.cum}km{p.camp ? " · camp" : ""}
                        </text>
                      </g>
                    )
                  })()}

                  {/* dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={dotR + (isActive ? 4 : 3)}
                    fill="rgba(0,0,0,0.25)"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={dotR}
                    fill={isHigh ? "#f0a500" : accent}
                    stroke={isActive ? "#14b8c8" : "rgba(255,255,255,0.25)"}
                    strokeWidth={isActive ? 2 : 0.75}
                  />
                  {p.camp && !isHigh && (
                    <circle cx={p.x} cy={p.y} r={2} fill="rgba(0,0,0,0.4)" />
                  )}
                </g>
              )
            })}
          </svg>

          {/* ── ALTITUDE BAR CHART PANEL ── */}
          <svg
            viewBox={`0 0 ${W} ${BAR_H}`}
            className="mt-1 block h-auto w-full"
            role="img"
            aria-label={`Altitude bar chart for ${trek.name}`}
          >
            <defs>
              <linearGradient id="rm-bar-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a2830" />
                <stop offset="100%" stopColor="#162028" />
              </linearGradient>
            </defs>
            <rect width={W} height={BAR_H} fill="url(#rm-bar-bg)" rx="10" />
            <text
              x={BAR_PAD.left}
              y={BAR_PAD.top - 5}
              fontFamily="monospace"
              fontWeight="bold"
              fontSize="8"
              fill="rgba(138,168,164,0.45)"
            >
              ALTITUDE PROFILE — OUTWARD ROUTE
            </text>

            {/* grid */}
            {[0, 0.5, 1].map((f) => {
              const yy = BAR_PAD.top + BAR_CH - f * BAR_CH
              const elv = Math.round(chart.minElv + f * (chart.maxElv - chart.minElv))
              return (
                <g key={f}>
                  <line
                    x1={BAR_PAD.left}
                    x2={W - BAR_PAD.right}
                    y1={yy}
                    y2={yy}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                  <text
                    x={BAR_PAD.left - 6}
                    y={yy + 3}
                    textAnchor="end"
                    fontFamily="monospace"
                    fontSize="8"
                    fill="rgba(138,168,164,0.65)"
                  >
                    {fmtK(elv)}
                  </text>
                </g>
              )
            })}

            {/* bars */}
            {bars.bars.map((b, i) => {
              const isActive = active === i
              const gap = Math.max(1, b.barW * 0.15)
              return (
                <g
                  key={`${b.label}-bar-${i}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(isActive ? null : i)}
                  className="cursor-pointer"
                >
                  <defs>
                    <linearGradient
                      id={`rm-bar-${i}`}
                      x1="0"
                      y1={b.by}
                      x2="0"
                      y2={BAR_PAD.top + BAR_CH}
                    >
                      <stop
                        offset="0%"
                        stopColor={b.isHigh ? "#ffd700" : "#14b8c8"}
                        stopOpacity={isActive ? 1 : 0.85}
                      />
                      <stop
                        offset="100%"
                        stopColor={b.isHigh ? "#ffd700" : accent}
                        stopOpacity={isActive ? 0.2 : 0.12}
                      />
                    </linearGradient>
                  </defs>
                  <rect
                    x={b.cx - b.barW / 2 + gap}
                    y={b.by}
                    width={b.barW - gap * 2}
                    height={b.bh}
                    rx="2"
                    fill={`url(#rm-bar-${i})`}
                  />
                  <rect
                    x={b.cx - b.barW / 2 + gap}
                    y={b.by}
                    width={b.barW - gap * 2}
                    height={isActive ? 3 : 2}
                    rx="1"
                    fill={b.isHigh ? "#ffd700" : "#14b8c8"}
                  />
                  <text
                    x={Math.max(BAR_PAD.left + 12, Math.min(W - 12, b.cx))}
                    y={BAR_PAD.top + BAR_CH + 16}
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontSize="8"
                    fill={isActive ? "#14b8c8" : "rgba(180,220,180,0.65)"}
                  >
                    {b.label.slice(0, 10)}
                  </text>
                </g>
              )
            })}

            {/* dashed trend line */}
            <polyline
              points={bars.trend}
              fill="none"
              stroke={accent}
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>
        </div>
      </motion.div>

      {/* stats strip (mirrors HTML) */}
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Max Elev", value: `${chart.maxElv.toLocaleString()}m` },
          { label: "Start Elev", value: `${chart.startElv.toLocaleString()}m` },
          { label: "Total Gain", value: `+${chart.gain.toLocaleString()}m` },
          { label: "Distance", value: `${chart.totalDist} km` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card px-3.5 py-2.5">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {s.label}
            </dt>
            <dd className="mt-0.5 font-mono text-sm font-semibold text-foreground">{s.value}</dd>
          </div>
        ))}
      </dl>

      {/* checkpoint list */}
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
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: p === chart.highP ? "#f0a500" : accent }}
              aria-hidden="true"
            />
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