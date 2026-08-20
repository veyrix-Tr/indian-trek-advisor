"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { motion, useReducedMotion } from "framer-motion"
import { Search, MapPin, Compass, Users, ChevronDown } from "lucide-react"
import { TrekSearch } from "@/components/trek-search"
import { useAuthGuard } from "@/hooks/use-auth-guard"

const Hero3D = dynamic(() => import("./hero-3d"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#1e3a5f_0%,#0a9e9a_65%)]" />
  ),
})

const HEADLINE_LINE_1 = ["Find", "Local", "Guides."]
const HEADLINE_LINE_2 = ["Trek", "On", "Your", "Terms."]

export function HeroSection() {
  const router = useRouter()
  const { requireAuth } = useAuthGuard()
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
      {/* Bottom fade into page background — the 3D scene is always dark, so this
          stays a fixed dark tone in both dark and light mode. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0e1a16]" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 px-4 pb-16 pt-24 text-center md:gap-8 md:px-6 md:pb-24 md:pt-32">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="inline-block rounded-full bg-black/40 px-4 py-4.5 font-mono text-[13px] uppercase tracking-[0.18em] text-yellow-100 sm:text-xs"
        >
          {"\u25B2"} India &middot; Solo Trekkers &middot; Small Groups &middot; Local Guides
        </motion.p>

        <h1 className="text-balance px-1 text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
          <span className="block">
            {HEADLINE_LINE_1.map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                className="mr-[0.24em] inline-block last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </span>
          <span className="block text-emerald-300">
            {HEADLINE_LINE_2.map((word, i) => (
              <motion.span
                key={word}
                custom={i + HEADLINE_LINE_1.length}
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                className="mr-[0.24em] inline-block last:mr-0"
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
          className="max-w-2xl text-pretty leading-relaxed text-white/85 md:text-lg"
        >
          100 trails across India &mdash; with real permit info, solo safety
          notes, and independent local guides. No large groups. No packaged
          tours.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="w-full max-w-xl"
        >
          <TrekSearch
            trigger={
              <button
                type="button"
                className="flex w-full cursor-text items-center gap-2 rounded-full border border-white/15 bg-black/30 p-1.5 pl-4 backdrop-blur-md sm:pl-5"
              >
                <Search className="size-4 shrink-0 text-white/70" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-left text-xs text-white/70 sm:text-sm">
                  Search 100 trails: Kedarkantha, Ladakh, Kashmir...
                </span>
                <span className="shrink-0 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white sm:px-5 sm:text-sm">
                  Explore
                </span>
              </button>
            }
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-2.5"
        >
          <PillButton
            icon={<MapPin className="size-3.5" aria-hidden="true" />}
            label="Find a Local Guide"
            onClick={() => {
              if (requireAuth()) {
                router.push("/guide/find")
              }
            }}
          />
          <PillButton
            icon={<Compass className="size-3.5" aria-hidden="true" />}
            label="Why Trek Solo?"
            onClick={() => {
              if (requireAuth()) {
                router.push("/guide/solo")
              }
            }}
          />
          <PillButton
            icon={<Users className="size-3.5" aria-hidden="true" />}
            label="Trek With Your Crew"
            onClick={() => {
              if (requireAuth()) {
                router.push("/guide/group")
              }
            }}
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
      className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/80 backdrop-blur-md transition-all hover:border-emerald-300/60 hover:bg-emerald-500/20 hover:text-white"
    >
      {icon}
      {label}
    </button>
  )
}
