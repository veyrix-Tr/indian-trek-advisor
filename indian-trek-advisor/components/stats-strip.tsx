"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useInView, useReducedMotion } from "framer-motion"

interface Stat {
  value: number
  label: string
  href: string
}

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const prefersReduced = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (prefersReduced) {
      setDisplay(value)
      return
    }
    const duration = 1400
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, prefersReduced])

  return <span ref={ref}>{display}</span>
}

export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <section aria-label="Trail statistics" className="border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={i === stats.length - 1 ? "col-span-2 md:col-span-1" : ""}
          >
            <Link
              href={stat.href}
              className="group flex flex-col items-center gap-1 border-border px-4 py-8 text-center transition-colors hover:bg-primary/5 md:border-l md:first:border-l-0"
            >
              <span className="text-4xl font-bold text-primary md:text-5xl">
                <Counter value={stat.value} />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-foreground">
                {stat.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
