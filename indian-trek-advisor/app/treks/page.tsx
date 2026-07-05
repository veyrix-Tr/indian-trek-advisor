import { Suspense } from "react"
import type { Metadata } from "next"
import { TreksBrowser } from "@/components/treks/treks-browser"
import { BackButton } from "@/components/ui/back-button"

export const metadata: Metadata = {
  title: "All Treks — TrekAdvisor",
  description:
    "Browse 110 trekking trails across India with permit info, difficulty, itineraries, and local guides. Filter by difficulty, duration, and region.",
}

export default function TreksPage() {
  return (
    <main className="pt-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
        <BackButton />
      </div>
      <Suspense fallback={null}>
        <TreksBrowser />
      </Suspense>
    </main>
  )
}
