"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useOverlays } from "./overlays/overlay-provider"

export function AuthRequiredHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openAuth } = useOverlays()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    if (searchParams.get("auth") === "required") {
      handled.current = true
      openAuth()
      router.replace("/")
    } else if (searchParams.get("auth") === "verified") {
      handled.current = true
      const next = searchParams.get("next") || "/"
      openAuth("Your account has been successfully verified. Please sign in to continue.")
      router.replace(next)
    }
  }, [searchParams, openAuth, router])

  return null
}
