"use client"

import { Camera } from "lucide-react"

/**
 * Trail Photos — not yet implemented.
 * Community photo uploads with GPS-verified locations are coming soon.
 */
export function PhotosTab() {
  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
        Trail Photos
      </h2>

      <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Camera className="size-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-foreground">Photos are on the way</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Community photo uploads with GPS-verified trail locations are coming soon.
            Trekkers will be able to share their own photos right here.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
          Coming Soon
        </span>
      </div>
    </div>
  )
}