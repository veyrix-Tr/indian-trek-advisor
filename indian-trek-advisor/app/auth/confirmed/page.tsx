"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useOverlays } from "@/components/overlays/overlay-provider"

function ConfirmedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openAuth } = useOverlays()
  const next = searchParams.get("next") || "/"

  function handleSignIn() {
    router.push(next)
    openAuth()
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          textAlign: "center",
          background: "#141a17",
          border: "1px solid #2a332e",
          borderRadius: 16,
          padding: "40px 28px",
        }}
      >
        <div style={{ fontSize: 52 }}>✔️</div>
        <h1 style={{ margin: "16px 0 8px", fontSize: 22, color: "#ffffff" }}>
          Email verified successfully!
        </h1>
        <p style={{ margin: 0, lineHeight: 1.6, color: "#d6d3d1", fontSize: 14 }}>
          Your account is now verified. Please sign in to continue to your treks, saved lists,
          guides and bookings.
        </p>
        <button
          onClick={handleSignIn}
          style={{
            marginTop: 24,
            background: "#16a34a",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: 15,
            padding: "12px 28px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmedContent />
    </Suspense>
  )
}