"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Calendar, CreditCard, Star, ShieldCheck, Check } from "lucide-react"

export interface AppNotification {
  id: string
  type: "booking_request" | "booking_status_change" | "review_received" | "verification_update"
  message: string
  read: boolean
  created_at: string
}

const TYPE_ICON: Record<AppNotification["type"], typeof Bell> = {
  booking_request: Calendar,
  booking_status_change: CreditCard,
  review_received: Star,
  verification_update: ShieldCheck,
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(diffMs / 3_600_000)
  if (hrs < 1) return "Just now"
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch {
      // silent — bell just shows nothing rather than erroring the whole header
    }
    setLoaded(true)
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
    } catch {
      // optimistic update; a failed sync just means it may reappear next fetch
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
    } catch {
      // same fallback reasoning as markRead
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          setOpen((v) => !v)
          if (!loaded) fetchNotifications()
        }}
        className="relative flex size-9 items-center justify-center rounded-xl border border-border/40 bg-background/40 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-status-pending text-[9px] font-bold text-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Notifications
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-primary hover:underline"
                >
                  <Check className="size-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {loaded ? "No notifications yet" : "Loading..."}
                </p>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type] || Bell
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`flex w-full items-start gap-3 border-b border-border/20 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/50 ${
                        n.read ? "" : "bg-primary/5"
                      }`}
                    >
                      <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${n.read ? "bg-muted/40" : "bg-primary/10"}`}>
                        <Icon className={`size-3.5 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs leading-relaxed ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                          {n.message}
                        </p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-status-pending" />}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}