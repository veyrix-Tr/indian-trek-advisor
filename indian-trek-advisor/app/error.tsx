"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Mountain } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
      </span>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-destructive">
        Something Went Wrong
      </p>
      <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        We hit a rough patch
      </h1>
      <p className="mx-auto mt-3 max-w-md text-pretty leading-relaxed text-muted-foreground">
        An unexpected error occurred. You can try again, or head back to the trail.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button className="gap-2 rounded-full" onClick={() => reset()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Try Again
        </Button>
        <Button
          variant="outline"
          className="gap-2 rounded-full bg-transparent"
          nativeButton={false}
          render={
            <Link href="/">
              <Mountain className="size-4" aria-hidden="true" />
              Back to Home
            </Link>
          }
        />
      </div>
    </div>
  )
}
