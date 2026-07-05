"use client"

import { motion } from "framer-motion"
import { Store, X } from "lucide-react"
import { GEAR_REGIONS, GEAR_TYPES } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOverlays } from "@/components/overlays/overlay-provider"

export function GearListingForm({ onClose }: { onClose: () => void }) {
  const { openComingSoon } = useOverlays()

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 overflow-hidden rounded-xl border border-border bg-card"
      onSubmit={(e) => {
        e.preventDefault()
        openComingSoon({
          title: "Gear Shop Listings",
          message:
            "Shop listings open soon. We'll verify your shop details and put you in front of trekkers planning routes in your region — free for local shops.",
        })
      }}
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
          <Store className="size-3.5" aria-hidden="true" />
          List Your Gear Shop
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close listing form"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shop-name">Shop Name</Label>
          <Input id="shop-name" name="shopName" placeholder="e.g. Himalayan Gear House" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-town">Town / Village</Label>
          <Input id="shop-town" name="town" placeholder="e.g. Sankri" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-region">Region</Label>
          <Select name="region" items={GEAR_REGIONS.map((r) => ({ value: r, label: r }))}>
            <SelectTrigger id="shop-region" className="w-full">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {GEAR_REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-phone">Phone / WhatsApp</Label>
          <Input id="shop-phone" name="phone" type="tel" placeholder="+91 XXXXX XXXXX" required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shop-gear">Gear You Rent</Label>
          <Input
            id="shop-gear"
            name="gear"
            placeholder={`e.g. ${GEAR_TYPES.slice(0, 4)
              .map((g) => g.label)
              .join(", ")}`}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shop-rates">Typical Rates</Label>
          <Input id="shop-rates" name="rates" placeholder="e.g. ₹100–400/day per item" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shop-desc">About Your Shop</Label>
          <Textarea
            id="shop-desc"
            name="desc"
            rows={3}
            placeholder="Stock, brands, seasons you operate, nearby trailheads..."
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-border bg-secondary/40 px-6 py-4">
        <Button type="submit" className="rounded-full">
          Submit Listing
        </Button>
      </div>
    </motion.form>
  )
}
