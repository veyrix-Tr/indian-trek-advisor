import { getAdminClient } from "@/lib/supabase-admin"

export interface LogContext {
  source: string
  route?: string
  method?: string
  context?: Record<string, unknown>
}

// Best-effort server-side error logging. Never throws: logging must not take
// down the request that triggered it. Falls back to console.error if the
// write to Supabase fails (e.g. migration not yet applied).
export async function logError(error: unknown, info: LogContext) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  try {
    const supabase = getAdminClient()
    await supabase.from("app_error_logs").insert({
      level: "error",
      source: info.source,
      route: info.route ?? null,
      method: info.method ?? null,
      context: info.context ?? null,
      message,
      stack,
    })
  } catch {
    // Logging infra unavailable — surface to platform logs at least.
    console.error(`[error:${info.source}]`, info.route ?? "", message)
    if (stack) console.error(stack)
  }
}