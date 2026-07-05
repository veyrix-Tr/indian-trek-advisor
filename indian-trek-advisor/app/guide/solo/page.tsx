"use client"

import { BackButton } from "@/components/ui/back-button"
import { SoloGuide } from "@/components/overlays/guide-overlays"

export default function GuideSoloPage() {
  return (
    <main className="pt-16">
      <div className="mx-auto max-w-5xl px-4 pt-6 md:px-6">
        <BackButton />
      </div>
      <SoloGuide />
    </main>
  )
}
