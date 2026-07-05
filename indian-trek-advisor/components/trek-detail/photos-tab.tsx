"use client"

import { motion } from "framer-motion"
import { Camera, ImagePlus, Mountain } from "lucide-react"
import type { Trek } from "@/lib/data"
import { getTrekSlug } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { useOverlays } from "@/components/overlays/overlay-provider"

/**
 * Photo gallery. Real photos live at /public/treks/[slug].jpg (hero) and
 * /public/treks/[slug]-1.jpg ... [slug]-5.jpg (gallery). Until those exist,
 * gradient placeholder tiles are shown using the trek's own palette.
 */
export function PhotosTab({ trek }: { trek: Trek }) {
  const { openComingSoon } = useOverlays()
  const slug = getTrekSlug(trek)
  const tiles = Array.from({ length: 6 }, (_, i) => i)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
            Trail Photos
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Community photo uploads are coming soon. Drop real images into{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
              /public/treks/{slug}-1.jpg
            </code>{" "}
            through{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
              -6.jpg
            </code>{" "}
            and they&apos;ll appear here automatically.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full bg-transparent"
          onClick={() =>
            openComingSoon({
              title: "Photo Uploads",
              message:
                "Community photo uploads are coming soon. Trekkers will be able to share trail photos with GPS-verified locations.",
            })
          }
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          Upload Photos
        </Button>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {tiles.map((i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border"
          >
            <PhotoTile trek={trek} slug={slug} index={i + 1} />
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function PhotoTile({
  trek,
  slug,
  index,
}: {
  trek: Trek
  slug: string
  index: number
}) {
  return (
    <>
      {/* real photo if present */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/treks/${slug}-${index}.jpg`}
        alt={`${trek.name} trail photo ${index}`}
        className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 [&:not([data-error])]:opacity-100"
        onError={(e) => {
          e.currentTarget.style.display = "none"
        }}
      />
      {/* gradient placeholder */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grain flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
        style={{
          background: `linear-gradient(${120 + index * 40}deg, ${trek.color1}, ${trek.color2})`,
        }}
      >
        {index % 2 === 0 ? (
          <Mountain className="size-8 text-white/25" aria-hidden="true" />
        ) : (
          <Camera className="size-8 text-white/25" aria-hidden="true" />
        )}
      </div>
    </>
  )
}
