"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BadgeCheck, Languages, MapPin, Phone, UserPlus, Users } from "lucide-react"
import type { Trek } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useOverlays } from "@/components/overlays/overlay-provider"

export function GuidesTab({ trek }: { trek: Trek }) {
  const { openComingSoon } = useOverlays()
  const [showForm, setShowForm] = useState(false)
  const region = trek.region ?? trek.state

  return (
    <div className="max-w-3xl space-y-8">
      {/* Empty state / marketplace intro */}
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Users className="size-6 text-primary" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-balance text-xl font-bold text-foreground">
          Independent Local Guides for {trek.name}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          We&apos;re onboarding verified, independent guides from {region}. No agencies, no
          middlemen — you deal directly with the person who walks the trail.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            className="rounded-full"
            onClick={() =>
              openComingSoon({
                title: "Guide Booking",
                message: `Booking a local guide for ${trek.name} is coming soon. Leave your email and we'll notify you the moment guides from ${region} are live.`,
              })
            }
          >
            <BadgeCheck className="size-4" aria-hidden="true" />
            Book a Guide
          </Button>
          <Button
            variant="outline"
            className="rounded-full bg-transparent"
            onClick={() => setShowForm((s) => !s)}
          >
            <UserPlus className="size-4" aria-hidden="true" />
            I&apos;m a Guide — Register
          </Button>
        </div>

        <ul className="mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-3">
          {[
            { icon: BadgeCheck, text: "ID & certification verified" },
            { icon: Languages, text: "Local language & terrain knowledge" },
            { icon: Phone, text: "Direct contact, fair rates" },
          ].map((item) => (
            <li
              key={item.text}
              className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground"
            >
              <item.icon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Guide registration form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden rounded-xl border border-border bg-card"
          onSubmit={(e) => {
            e.preventDefault()
            openComingSoon({
              title: "Guide Registration",
              message:
                "Guide registration opens soon. We'll verify your ID, certifications, and trail experience, then list your profile — free for independent guides.",
            })
          }}
        >
          <div className="space-y-5 p-6">
            <div>
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                <UserPlus className="size-3.5" aria-hidden="true" />
                Register as a Local Guide
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                List yourself for {trek.name} and other trails in {region}.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guide-name">Full Name</Label>
                <Input id="guide-name" name="name" placeholder="e.g. Rajesh Rana" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guide-phone">Phone / WhatsApp</Label>
                <Input
                  id="guide-phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guide-village">Village / Town</Label>
                <Input id="guide-village" name="village" placeholder={trek.baseCamp ?? "Base village"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guide-experience">Years of Experience</Label>
                <Input
                  id="guide-experience"
                  name="experience"
                  type="number"
                  min="0"
                  max="60"
                  placeholder="e.g. 8"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="guide-languages">Languages Spoken</Label>
                <Input
                  id="guide-languages"
                  name="languages"
                  placeholder="e.g. Hindi, English, Garhwali"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="guide-bio">About You & Your Trails</Label>
                <Textarea
                  id="guide-bio"
                  name="bio"
                  rows={4}
                  placeholder="Certifications, treks you lead, group sizes you handle..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden="true" />
              Free listing for independent guides
            </p>
            <Button type="submit" className="rounded-full">
              Submit for Verification
            </Button>
          </div>
        </motion.form>
      )}
    </div>
  )
}
