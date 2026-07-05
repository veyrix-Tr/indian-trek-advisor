"use client"

import { BackButton } from "@/components/ui/back-button"
import { FindGuide } from "@/components/overlays/guide-overlays"

export default function GuideFindPage() {
  return (
    <main className="pt-16">
      <div className="mx-auto max-w-3xl px-4 pt-6 md:px-6">
        <BackButton />
      </div>
      <FindGuide />
    </main>
  )
}
