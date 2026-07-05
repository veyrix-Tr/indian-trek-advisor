import { Suspense } from "react"
import type { Metadata } from "next"
import { TreksBrowser } from "@/components/treks/treks-browser"

export const metadata: Metadata = {
  title: "All Treks — TrekAdvisor",
  description:
    "Browse 110 trekking trails across India with permit info, difficulty, itineraries, and local guides. Filter by difficulty, duration, and region.",
}

export default function TreksPage() {
  return (
    <main className="pt-16">
      <Suspense fallback={null}>
        <TreksBrowser />
      </Suspense>
    </main>
  )
}
