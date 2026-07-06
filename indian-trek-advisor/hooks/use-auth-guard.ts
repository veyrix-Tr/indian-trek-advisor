"use client"

import { useCallback } from "react"
import { useUser } from "./use-user"
import { useOverlays } from "@/components/overlays/overlay-provider"

export function useAuthGuard() {
  const { user, loading } = useUser()
  const { openAuth } = useOverlays()

  const requireAuth = useCallback(() => {
    if (loading) return false
    if (!user) {
      openAuth()
      return false
    }
    return true
  }, [user, loading, openAuth])

  return { requireAuth, user, loading }
}
