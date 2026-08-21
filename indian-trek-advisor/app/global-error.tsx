"use client"

import { useEffect } from "react"

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          background: "#10140f",
          color: "#f2f2ee",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "#e6543a",
            margin: 0,
          }}
        >
          Something Went Wrong
        </p>
        <h1 style={{ marginTop: "12px", fontSize: "28px", fontWeight: 700 }}>
          Core Trek-kin hit a critical error
        </h1>
        <p style={{ marginTop: "12px", maxWidth: "420px", color: "#a3a39c", lineHeight: 1.6 }}>
          Something went wrong loading the app. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "24px",
            padding: "10px 24px",
            borderRadius: "9999px",
            background: "#7fcf9e",
            color: "#10140f",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  )
}
