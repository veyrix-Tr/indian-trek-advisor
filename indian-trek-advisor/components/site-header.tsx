"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Mountain, Sparkles, Menu, UserRound, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/treks", label: "Treks" },
  { href: "/treks?section=kailash", label: "Kailash Yatra" },
  { href: "/treks?section=panch-kedar", label: "Panch Kedar" },
  { href: "/gear", label: "Gear Rental" },
]

export function SiteHeader() {
  const { openAi, openAuth } = useOverlays()
  const { user, loading } = useUser()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  function isActive(link: (typeof NAV_LINKS)[number]): boolean {
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <Mountain className="size-5 text-primary" aria-hidden="true" />
          <span>
            Trek<span className="text-primary">Advisor</span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "rounded-full px-3.5 py-2 font-mono text-xs uppercase tracking-widest transition-colors",
                isActive(link)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <TrekSearch />
          <Button
            variant="outline"
            size="sm"
            onClick={openAi}
            className="gap-1.5 border-primary/30 bg-primary/5 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/15 hover:text-primary"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Trail Guide AI
          </Button>
          {!loading && user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                {user.user_metadata?.name || user.email}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSignOut}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={openAuth} className="gap-1.5">
              <UserRound className="size-3.5" aria-hidden="true" />
              Sign In / Join
            </Button>
          )}
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
                TrekAdvisor
              </SheetTitle>
            </SheetHeader>
            <nav
              aria-label="Mobile navigation"
              className="flex flex-col gap-1 px-4"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-widest transition-colors",
                    isActive(link)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 px-4 pb-6">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileOpen(false)
                  openAi()
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
