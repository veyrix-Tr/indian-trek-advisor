"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    const next = searchParams.get("next") || "/"
    const supabase = createClient()

    ;(async () => {
      // Supabase's implicit flow delivers the tokens in the URL hash.
      // getSession() detects them and stores the session (auto sign-in).
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        router.replace(next)
      } else {
        router.replace(`/?auth=verified&next=${encodeURIComponent(next)}`)
      }
    })()
  }, [router, searchParams])

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        color: "#e7e5e4",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <p>Verifying your email…</p>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmContent />
    </Suspense>
  )
}