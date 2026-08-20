"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Bookmark, BookmarkCheck, Mountain, Trash2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { getTreksByNames } from "@/lib/data"
import { TrekCard } from "@/components/trek-card"
import { Button } from "@/components/ui/button"

export default function SavedTreksPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [savedNames, setSavedNames] = useState<string[]>([])
  const [removing, setRemoving] = useState<string | null>(null)

  const savedTreks = useMemo(
    () => getTreksByNames(savedNames),
    [savedNames],
  )

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/")
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single()
      if (profile?.account_type === "guide") {
        router.replace("/guide/dashboard")
        return
      }
      const { data: trekker, error: trekkerErr } = await supabase
        .from("trekkers")
        .select("saved_treks")
        .eq("user_id", user.id)
        .maybeSingle()
      if (trekkerErr) {
        console.error("Error loading saved treks:", trekkerErr)
        return
      }
      if (active) {
        setSavedNames(trekker?.saved_treks ?? [])
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [supabase, router])

  async function removeTrek(name: string) {
    setRemoving(name)
    const next = savedNames.filter((n) => n !== name)
    setSavedNames(next)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("trekkers")
        .update({ saved_treks: next })
        .eq("user_id", user.id)
    }
    setRemoving(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pt-20">
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted/40 transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
              <ArrowLeft className="size-4" />
            </span>
            Back
          </button>

          <span className="font-mono text-[20px] uppercase tracking-[0.2em] text-muted-foreground/50">
            Saved Treks
          </span>
        </div>

        {savedTreks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card px-6 py-20 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bookmark className="size-7" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-bold">No saved treks yet</h1>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Tap the bookmark on any trek you like and it will appear here for quick access.
              </p>
            </div>
            <Button render={<a href="/treks" />} nativeButton={false} className="mt-2 gap-1.5">
              <Mountain className="size-4" aria-hidden="true" />
              Explore Treks
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <BookmarkCheck className="size-4 text-primary" aria-hidden="true" />
              {savedTreks.length} saved {savedTreks.length === 1 ? "trek" : "treks"}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {savedTreks.map((trek, i) => (
                <div key={trek.id} className="relative">
                  <TrekCard trek={trek} index={i} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeTrek(trek.name)}
                    disabled={removing === trek.name}
                    aria-label={`Remove ${trek.name} from saved`}
                    className="absolute right-3 top-3 z-10 size-8 rounded-full border-border bg-background/70 text-muted-foreground backdrop-blur-sm transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
