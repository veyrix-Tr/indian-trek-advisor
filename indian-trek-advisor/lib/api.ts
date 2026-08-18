import { NextResponse } from "next/server"
import { logError } from "@/lib/error-log"

type Handler<Args extends unknown[] = unknown[]> = (
  request: Request,
  ...args: Args
) => Promise<NextResponse>

// Wrap an API route handler so any uncaught error is logged to app_error_logs
// (and console) and returned as a clean 500, instead of failing silently.
export function withErrorHandling<Args extends unknown[] = unknown[]>(
  handler: Handler<Args>,
  info: { source: string; route: string }
): Handler<Args> {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args)
    } catch (err) {
      await logError(err, {
        source: info.source,
        route: info.route,
        method: request.method,
      })
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}