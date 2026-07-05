import type { Metadata } from "next"
import { GearDirectory } from "@/components/gear/gear-directory"

export const metadata: Metadata = {
  title: "Gear Rental — TrekAdvisor",
  description:
    "Find trekking gear rental shops across the Indian Himalayas — tents, sleeping bags, crampons, jackets, and more from local shops in Uttarakhand, Himachal, Kashmir, Ladakh, and Sikkim.",
}

export default function GearPage() {
  return (
    <main className="pt-16">
      <GearDirectory />
    </main>
  )
}
