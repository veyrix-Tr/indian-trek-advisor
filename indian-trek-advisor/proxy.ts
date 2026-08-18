import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { updateSession } from "@/utils/supabase/middleware"

// Browse/marketing/content pages stay public so visitors can explore before
// signing up (and so search engines can actually index them). Anything not
// listed here — /dashboard, /guide/dashboard, /admin, /profile, and all
// write actions — still requires auth.
const publicRoutes = ["/", "/api", "/treks", "/gear", "/guide/find", "/guide/solo", "/guide/group"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuth = !publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Create Supabase client once and reuse
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
      },
    },
  })

  if (needsAuth) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const url = new URL("/", request.url)
      url.searchParams.set("auth", "required")
      return NextResponse.redirect(url)
    }
  }

  // Update session (this will refresh if needed, but won't call getUser again)
  return await updateSession(request, supabase)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}