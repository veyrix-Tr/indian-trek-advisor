"use client"

import { ArrowRight } from "lucide-react"
import { AuthGatedLink } from "@/components/auth-gated-link"

export function GearTeaserLink() {
  return (
    <AuthGatedLink
      href="/gear"
      className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-transform hover:scale-105"
    >
      Browse Gear Shops
      <ArrowRight
        className="size-4 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      />
    </AuthGatedLink>
  )
}
