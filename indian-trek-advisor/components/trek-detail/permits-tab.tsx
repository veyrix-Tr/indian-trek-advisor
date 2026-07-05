"use client"

import { motion } from "framer-motion"
import { AlertTriangle, Banknote, FileCheck, Globe, MapPin, ShieldCheck } from "lucide-react"
import type { Trek } from "@/lib/data"

export function PermitsTab({ trek }: { trek: Trek }) {
  const info = trek.permitInfo

  if (!trek.permitRequired && !info) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-difficulty-easy/30 bg-difficulty-easy/5 p-6">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-difficulty-easy" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-foreground">No Permit Required</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            This trail does not require a trekking permit for Indian nationals. Carry a
            government photo ID — check-posts may still record entries.
          </p>
        </div>
      </div>
    )
  }

  const rows = [
    { key: "type", label: "Permit Type", icon: FileCheck, value: info?.type },
    { key: "where", label: "Where to Get It", icon: MapPin, value: info?.where },
    { key: "fee", label: "Fees", icon: Banknote, value: info?.fee },
    { key: "foreigners", label: "Foreign Nationals", icon: Globe, value: info?.foreigners },
  ].filter((r) => r.value)

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
        <FileCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-foreground">
            {trek.permitType ?? "Permit Required"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Official permit information for {trek.name}. Verify current rules before travel —
            fees and procedures change seasonally.
          </p>
        </div>
      </div>

      <dl className="space-y-4">
        {rows.map((row, i) => (
          <motion.div
            key={row.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <dt className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
              <row.icon className="size-3.5" aria-hidden="true" />
              {row.label}
            </dt>
            <dd className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {row.value}
            </dd>
          </motion.div>
        ))}
      </dl>

      {info?.note && (
        <div className="flex items-start gap-3 rounded-xl border border-difficulty-moderate/30 bg-difficulty-moderate/5 p-5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-difficulty-moderate"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-difficulty-moderate">
              Important Notes
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {info.note}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
