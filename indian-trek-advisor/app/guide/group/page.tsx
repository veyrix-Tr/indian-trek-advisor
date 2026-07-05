"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { GroupGuide } from "@/components/overlays/guide-overlays"

export default function GuideGroupPage() {
  const router = useRouter()

  return (
    <main className="pt-16">
      <div className="mx-auto max-w-5xl px-4 pt-6 md:px-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          Back
        </button>
      </div>
      <GroupGuide />
    </main>
  )
}
