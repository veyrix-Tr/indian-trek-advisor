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
    if (searchParams.get("auth") === "required" && !handled.current) {
      handled.current = true
      openAuth()
      router.replace("/")
    }
  }, [searchParams, openAuth, router])

  return null
}
