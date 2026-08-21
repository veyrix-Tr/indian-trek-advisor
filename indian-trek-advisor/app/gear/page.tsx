import type { Metadata } from "next"
import { GearDirectory } from "@/components/gear/gear-directory"
import { BackButton } from "@/components/ui/back-button"

export const metadata: Metadata = {
  title: "Gear Rental — Core Trek-kin",
  description:
    "Find trekking gear rental shops across the Indian Himalayas — tents, sleeping bags, crampons, jackets, and more from local shops in Uttarakhand, Himachal, Kashmir, Ladakh, and Sikkim.",
}

export default function GearPage() {
  return (
    <main className="pt-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
        <BackButton />
      </div>
      <GearDirectory />
    </main>
  )
}
