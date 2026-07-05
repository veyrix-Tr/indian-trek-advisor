import { Mountain } from "lucide-react"

export default function TreksLoading() {
  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 shadow-xs backdrop-blur-md">
      <Mountain className="size-3.5 animate-pulse text-primary" aria-hidden="true" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Loading treks...
      </span>
    </div>
  )
}
