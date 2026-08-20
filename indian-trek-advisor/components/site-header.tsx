"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Mountain, Sparkles, Menu, UserRound, LogOut, ChevronDown, User, Shield, Bookmark, Star, CalendarDays, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useOverlays } from "@/components/overlays/overlay-provider"
import { TrekSearch } from "@/components/trek-search"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/utils/supabase/client"
import { AuthGatedLink } from "@/components/auth-gated-link"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { NotificationBell } from "@/components/notification-bell"

const BASE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/treks", label: "Treks" },
]

const TREKKER_LINKS = [
  { href: "/treks?section=kailash", label: "Kailash Yatra" },
  { href: "/treks?section=panch-kedar", label: "Panch Kedar" },
  { href: "/gear", label: "Gear Rental" },
]

const GUIDE_LINKS = [
  { href: "/guide/dashboard", label: "My Dashboard" },
]

const ADMIN_LINKS = [
  { href: "/admin", label: "Admin Panel" },
  { href: "/admin/bookings", label: "Bookings" },
]

export function SiteHeader() {
  const { openAi, openAuth } = useOverlays()
  const { user, loading } = useUser()
  const { requireAuth } = useAuthGuard()
  const { toggleTheme } = useTheme()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountType, setAccountType] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!user) { setAccountType(null); return }
    const supabase = createClient()
    supabase.from("profiles").select("account_type").eq("id", user.id).single()
      .then(({ data }) => setAccountType(data?.account_type ?? null))
  }, [user])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  function isActive(link: { href: string; label: string }): boolean {
    if (link.href === "/") return pathname === "/"
    const [path, qs] = link.href.split("?")
    if (path !== pathname) return false
    if (!qs) return !searchParams.toString()
    const params = new URLSearchParams(qs)
    for (const [k, v] of params) {
      if (searchParams.get(k) !== v) return false
    }
    return true
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-background/25 backdrop-blur-xl before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/5 before:via-cyan-500/5 before:to-blue-500/5 before:animate-pulse before:pointer-events-none light:border-b light:border-emerald-200/60 light:bg-gradient-to-r light:from-emerald-200/90 light:via-cyan-200/90 light:to-sky-200/90">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground"
        >
          <Mountain className="size-6 text-primary" aria-hidden="true" />
          <span>
            Indian Trek <span className="text-primary">Advisor</span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-3 lg:flex"
        >
          {[
            ...BASE_LINKS,
            ...(accountType === "guide" ? GUIDE_LINKS : accountType === "admin" ? ADMIN_LINKS : TREKKER_LINKS),
          ].map((link) => (
            <AuthGatedLink
              key={link.label}
              href={link.href}
              className={cn(
                "rounded-full px-5 py-2.5 text-base font-medium leading-relaxed transition-all hover:scale-115",
                isActive(link)
                  ? "bg-primary/25 text-primary"
                  : "text-foreground/80 hover:bg-accent hover:text-foreground",
              )}
            >
              {link.label}
            </AuthGatedLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <TrekSearch />
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle light / dark mode"
            onClick={toggleTheme}
            className="border-border/70 bg-white/5 text-foreground/80 hover:bg-white/10 hover:text-foreground dark:bg-white/5 dark:hover:bg-white/10"
          >
            <span className="light-hidden">
              <Sun className="size-4" aria-hidden="true" />
            </span>
            <span className="light-only">
              <Moon className="size-4" aria-hidden="true" />
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (requireAuth()) {
                openAi()
              }
            }}
            className="gap-1.5 border-primary/60 bg-primary/20 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/30 hover:text-primary hover:scale-105 transition-all"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Trail Guide AI
          </Button>
          <div className="ml-2 flex items-center">
            {!loading && user ? (
              <>
                <NotificationBell />
                <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="group flex items-center gap-1.5 rounded-full bg-white/5 p-1 pr-2.5 transition-colors hover:bg-white/15"
                >                  <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white shadow-sm ring-1 ring-white/20">
                    {(user.user_metadata?.name || user.email).charAt(0).toUpperCase()}
                  </span>
                  {accountType === "admin" && (
                    <Link
                      href="/admin"
                      onClick={(e) => e.stopPropagation()}
                      className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm ring-1 ring-white/20 transition-transform hover:scale-110"
                    >
                      <Shield className="size-3 text-black" />
                    </Link>
                  )}
                  <ChevronDown className={`size-3 text-white/60 transition-all duration-200 group-hover:text-white/90 ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-black/20 backdrop-blur-2xl">
                      <div className="bg-gradient-to-br from-primary/10 to-transparent px-4 pb-3 pt-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white shadow-sm ring-1 ring-white/20">
                            {(user.user_metadata?.name || user.email).charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {user.user_metadata?.name || "User"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    <div className="border-t border-border" />
                    <div className="p-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <User className="size-4" />
                        Profile
                      </Link>
                        {accountType === "trekker" && (
                          <Link
                            href="/saved"
                            onClick={() => setProfileOpen(false)}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Bookmark className="size-4" />
                            Saved Treks
                          </Link>
                        )}
                        {accountType === "trekker" && (
                          <>
                            <Link
                              href="/dashboard/bookings"
                              onClick={() => setProfileOpen(false)}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <CalendarDays className="size-4" />
                              My Bookings
                            </Link>
                            <Link
                              href="/reviews"
                              onClick={() => setProfileOpen(false)}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <Star className="size-4" />
                              My Reviews
                            </Link>
                          </>
                        )}
                      {accountType === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-amber-600 transition-colors hover:bg-amber-500/15 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-400"
                        >
                          <Shield className="size-4" />
                          Admin View
                        </Link>
                      )}
                      {accountType === "guide" && (
                        <Link
                          href="/guide/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-primary transition-colors hover:bg-primary/15 hover:text-primary"
                        >
                          <Mountain className="size-4" />
                          Guide Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-red-500/15 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <LogOut className="size-4" />
                        Sign Out
                      </button>
                    </div>
                    </div>
                  </>
                )}
              </div>
              </>
            ) : (
              <Button size="sm" onClick={() => openAuth()} className="gap-1.5">
                <UserRound className="size-3.5" aria-hidden="true" />
                Sign In / Join
              </Button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            }
          />
          <SheetContent side="right" className="w-72 border-border bg-card">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Mountain className="size-5 text-primary" aria-hidden="true" />
                Indian Trek Advisor
              </SheetTitle>
            </SheetHeader>
            <nav
              aria-label="Mobile navigation"
              className="flex flex-col gap-1 px-4"
            >
              {[
                ...BASE_LINKS,
                ...(accountType === "guide" ? GUIDE_LINKS : accountType === "admin" ? ADMIN_LINKS : TREKKER_LINKS),
              ].map((link) => (
                <AuthGatedLink
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-4 py-3 text-base font-medium leading-relaxed transition-all hover:scale-115",
                    isActive(link)
                      ? "bg-primary/25 text-primary"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground",
                  )}
                >
                  {link.label}
                </AuthGatedLink>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 px-4 pb-6">
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="justify-start gap-2 border-border/70 bg-white/5 text-foreground/80 hover:bg-white/10 hover:text-foreground"
              >
                <span className="light-hidden">
                  <Sun className="size-4" aria-hidden="true" />
                </span>
                <span className="light-only">
                  <Moon className="size-4" aria-hidden="true" />
                </span>
                <span className="light-hidden">Light mode</span>
                <span className="light-only">Dark mode</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMobileOpen(false)
                  if (requireAuth()) {
                    openAi()
                  }
                }}
                className="gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 hover:text-primary"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Trail Guide AI
              </Button>
              {!loading && user ? (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                    {user.user_metadata?.name || user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setMobileOpen(false)
                      handleSignOut()
                    }}
                    className="size-8 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setMobileOpen(false)
                    openAuth()
                  }}
                  className="gap-1.5"
                >
                  <UserRound className="size-4" aria-hidden="true" />
                  Sign In / Join
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
