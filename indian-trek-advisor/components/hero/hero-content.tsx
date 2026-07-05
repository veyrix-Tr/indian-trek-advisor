"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { motion, useReducedMotion } from "framer-motion"
import { Search, MapPin, Compass, Users, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const Hero3D = dynamic(() => import("./hero-3d"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#16211b_0%,#0c110e_65%)]" />
  ),
})

const HEADLINE_LINE_1 = ["Find", "Local", "Guides."]
const HEADLINE_LINE_2 = ["Trek", "On", "Your", "Terms."]

export function HeroSection() {
  const router = useRouter()
  const prefersReduced = useReducedMotion()
  const [query, setQuery] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(query.trim() ? `/treks?q=${encodeURIComponent(query.trim())}` : "/treks")
  }

  const wordVariants = {
    hidden: { opacity: 0, y: 28, rotateX: 40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { delay: 0.35 + i * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    }),
  }

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden">
      {/* 3D backdrop */}
      <div className="absolute inset-0">
        {mounted && <Hero3D reduced={Boolean(prefersReduced)} />}
      </div>
      {/* Bottom fade into page background */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 px-4 pb-24 pt-32 text-center md:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="font-mono text-[11px] uppercase tracking-[0.35em] text-primary md:text-xs"
        >
          {"\u25B2"} India &middot; Solo Trekkers &middot; Small Groups &middot; Local Guides
        </motion.p>

        <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          <span className="block">
            {HEADLINE_LINE_1.map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                className="mr-[0.28em] inline-block last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </span>
          <span className="block text-primary">
            {HEADLINE_LINE_2.map((word, i) => (
              <motion.span
                key={word}
                custom={i + HEADLINE_LINE_1.length}
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                className="mr-[0.28em] inline-block last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.7 }}
          className="max-w-2xl text-pretty leading-relaxed text-muted-foreground md:text-lg"
        >
          100 trails across India &mdash; with real permit info, solo safety
          notes, and independent local guides. No large groups. No packaged
          tours.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          onSubmit={handleSearch}
          className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card/80 p-1.5 pl-5 backdrop-blur-md"
        >
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="hero-search" className="sr-only">
            Search treks by name, region or state
          </label>
          <input
            id="hero-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 100 trails: Kedarkantha, Ladakh, Kashmir..."
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <Button type="submit" className="shrink-0 rounded-full px-5">
            Explore
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-2.5"
        >
          <PillButton
            icon={<MapPin className="size-3.5" aria-hidden="true" />}
            label="Find a Local Guide"
            onClick={() => router.push("/guide/find")}
          />
          <PillButton
            icon={<Compass className="size-3.5" aria-hidden="true" />}
            label="Why Trek Solo?"
            onClick={() => router.push("/guide/solo")}
          />
          <PillButton
            icon={<Users className="size-3.5" aria-hidden="true" />}
            label="Trek With Your Crew"
            onClick={() => router.push("/guide/group")}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-6 z-10"
        aria-hidden="true"
      >
        <ChevronDown className="size-5 animate-bounce text-muted-foreground/60" />
      </motion.div>
    </section>
  )
}

function PillButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground backdrop-blur-md transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
    >
      {icon}
      {label}
    </button>
  )
}
