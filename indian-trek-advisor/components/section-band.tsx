"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { AuthGatedLink } from "@/components/auth-gated-link"

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3"
    >
      <p className="flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
        <span className="h-px w-8 bg-primary/50" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-balance text-2xl font-bold tracking-tight text-transparent md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-sm text-pretty leading-relaxed text-foreground/80 md:text-base">
          {description}
        </p>
      )}
    </motion.div>
  )
}

export function BandLink({ href, label }: { href: string; label: string }) {
  return (
    <AuthGatedLink
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-6 py-3 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
    >
      {label}
      <ArrowRight
        className="size-4 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      />
    </AuthGatedLink>
  )
}
