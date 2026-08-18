"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle, Loader2, RefreshCw, Search, TerminalSquare,
  FileWarning, Route, Fingerprint,
} from "lucide-react"

interface ErrorLogEntry {
  id: string
  created_at: string
  source: string
  route?: string | null
  method?: string | null
  message?: string | null
  stack?: string | null
  context?: Record<string, unknown> | null
}

export function ErrorLog() {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const params = new URLSearchParams()
    if (search.trim()) params.set("source", search.trim())
    try {
      const res = await fetch(`/api/admin/error-logs?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        setLogs([])
        setMigrationRequired(data.migrationRequired || false)
        return
      }
      setLogs(data.logs || [])
      setMigrationRequired(false)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const [migrationRequired, setMigrationRequired] = useState(false)

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <div className="space-y-4">
      {migrationRequired && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
          <FileWarning className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Migration not applied</p>
            <p className="mt-0.5 text-amber-400/80">
              Run <code className="rounded bg-amber-500/10 px-1.5 py-0.5">supabase-migration-app-error-log.sql</code> in the
              Supabase SQL Editor to start collecting errors.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by source (e.g. bookings.create)…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16">
          <Loader2 className="mb-3 size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground/50">Loading error log…</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card py-16">
          <AlertTriangle className="mb-3 size-10 text-muted-foreground/30" />
          <p className="text-base font-medium text-foreground">No errors recorded</p>
          <p className="mt-1 text-sm text-muted-foreground/50">Server-side API failures will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-red-500/20 bg-card p-4 transition-all hover:border-red-500/40 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                  <AlertTriangle className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-red-400/90">{log.message}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/60">
                    <span className="flex items-center gap-1">
                      <TerminalSquare className="size-3" />
                      {log.source}
                    </span>
                    {log.route && (
                      <span className="flex items-center gap-1">
                        <Route className="size-3" />
                        {log.route}
                      </span>
                    )}
                    {log.method && (
                      <span className="flex items-center gap-1">
                        <Fingerprint className="size-3" />
                        {log.method}
                      </span>
                    )}
                    <span>{formatTime(log.created_at)}</span>
                  </div>
                  {log.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] text-muted-foreground/50 hover:text-muted-foreground">
                        View stack trace
                      </summary>
                      <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
    })
  } catch {
    return iso
  }
}