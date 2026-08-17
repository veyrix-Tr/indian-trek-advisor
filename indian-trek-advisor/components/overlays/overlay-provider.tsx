"use client"

import { createContext, useCallback, useContext, useState } from "react"
import dynamic from "next/dynamic"

const ComingSoonDialog = dynamic(
  () => import("./coming-soon-dialog").then((m) => m.ComingSoonDialog),
  { ssr: false }
)
const AiPanel = dynamic(() => import("./ai-panel").then((m) => m.AiPanel), {
  ssr: false,
})
const AuthModal = dynamic(
  () => import("./auth-modal").then((m) => m.AuthModal),
  { ssr: false }
)
const GuideOverlay = dynamic(
  () => import("./guide-overlays").then((m) => m.GuideOverlay),
  { ssr: false }
)

export type GuideOverlayKind = "solo" | "group" | "findGuide"

export interface ComingSoonContext {
  title?: string
  message?: string
}

interface OverlayState {
  comingSoon: ComingSoonContext | null
  aiOpen: boolean
  authOpen: boolean
  authNotice: string | null
  guideOverlay: GuideOverlayKind | null
}

interface OverlayApi {
  openComingSoon: (ctx?: ComingSoonContext) => void
  openAi: () => void
  openAuth: (notice?: string) => void
  openGuide: (kind: GuideOverlayKind) => void
  closeAll: () => void
}

const OverlayContext = createContext<OverlayApi | null>(null)

export function useOverlays(): OverlayApi {
  const ctx = useContext(OverlayContext)
  if (!ctx) throw new Error("useOverlays must be used within OverlayProvider")
  return ctx
}

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OverlayState>({
    comingSoon: null,
    aiOpen: false,
    authOpen: false,
    authNotice: null,
    guideOverlay: null,
  })

  const openComingSoon = useCallback((ctx?: ComingSoonContext) => {
    setState((s) => ({ ...s, comingSoon: ctx ?? {} }))
  }, [])
  const openAi = useCallback(() => {
    setState((s) => ({ ...s, aiOpen: true }))
  }, [])
  const openAuth = useCallback((notice?: string) => {
    setState((s) => ({ ...s, authOpen: true, authNotice: notice ?? null }))
  }, [])
  const openGuide = useCallback((kind: GuideOverlayKind) => {
    setState((s) => ({ ...s, guideOverlay: kind }))
  }, [])
  const closeAll = useCallback(() => {
    setState({ comingSoon: null, aiOpen: false, authOpen: false, authNotice: null, guideOverlay: null })
  }, [])

  return (
    <OverlayContext.Provider
      value={{ openComingSoon, openAi, openAuth, openGuide, closeAll }}
    >
      {children}
      {state.comingSoon !== null && (
        <ComingSoonDialog
          context={state.comingSoon}
          onClose={() => setState((s) => ({ ...s, comingSoon: null }))}
        />
      )}
      {state.aiOpen && (
        <AiPanel onClose={() => setState((s) => ({ ...s, aiOpen: false }))} />
      )}
      {state.authOpen && (
        <AuthModal
          notice={state.authNotice}
          onClose={() => setState((s) => ({ ...s, authOpen: false }))}
        />
      )}
      {state.guideOverlay && (
        <GuideOverlay
          kind={state.guideOverlay}
          onClose={() => setState((s) => ({ ...s, guideOverlay: null }))}
        />
      )}
    </OverlayContext.Provider>
  )
}
