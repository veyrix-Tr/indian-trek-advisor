import Link from "next/link"
import { Compass, Mountain } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Compass className="size-8 text-primary" aria-hidden="true" />
      </span>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-primary">
        404 — Off the Trail
      </p>
      <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        This page doesn&apos;t exist
      </h1>
      <p className="mx-auto mt-3 max-w-md text-pretty leading-relaxed text-muted-foreground">
        The trail you&apos;re looking for isn&apos;t on the map. It may have moved, or the link might be wrong.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          className="gap-2 rounded-full"
          nativeButton={false}
          render={
            <Link href="/">
              <Mountain className="size-4" aria-hidden="true" />
              Back to Home
            </Link>
          }
        />
        <Button
          variant="outline"
          className="gap-2 rounded-full bg-transparent"
          nativeButton={false}
          render={<Link href="/treks">Browse Treks</Link>}
        />
      </div>
    </div>
  )
}
