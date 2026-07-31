"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Calendar, Mountain, IndianRupee, Star, Settings, RefreshCw } from "lucide-react"
import { GuideStatsCards } from "@/components/guide-dashboard/guide-stats-cards"
import { GuideOverviewTab } from "@/components/guide-dashboard/guide-overview-tab"
import { GuideBookingsTab } from "@/components/guide-dashboard/guide-bookings-tab"
import { GuideTreksTab } from "@/components/guide-dashboard/guide-treks-tab"
import { GuideEarningsTab } from "@/components/guide-dashboard/guide-earnings-tab"
import { GuideReviewsTab } from "@/components/guide-dashboard/guide-reviews-tab"
import { GuideSettingsTab } from "@/components/guide-dashboard/guide-settings-tab"
import { GuideAvailabilityCalendar } from "@/components/guide-availability-calendar"

interface Booking {
  id: string
  trek_id: string
  status: string
  booking_date: string
  notes?: string
  payment_amount?: number
  payment_status?: string
  trekker?: { name: string; email: string }
  guides?: { trek_name: string; id: string }
}

interface Review {
  id: string
  rating: number
  review_text?: string
  created_at: string
  trekker?: { name: string }
  guides?: { trek_name: string }
}

interface GuideProfile {
  experience?: string
  phone?: string
  base_location?: string
  certifications?: string[]
  known_treks?: string[]
  rating?: number
  verified?: boolean
  profile_photo_url?: string
  profiles?: { name: string; email: string }
}

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "bookings", label: "Bookings", icon: Calendar },
  { value: "treks", label: "Treks", icon: Mountain },
  { value: "earnings", label: "Earnings", icon: IndianRupee },
  { value: "reviews", label: "Reviews", icon: Star },
  { value: "availability", label: "Availability", icon: Calendar },
  { value: "settings", label: "Settings", icon: Settings },
]

export default function GuideDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [profile, setProfile] = useState<GuideProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [bookingsFilterHint, setBookingsFilterHint] = useState<{ filter: string; nonce: number } | undefined>(undefined)

  useEffect(() => {
    Promise.all([fetchBookings(), fetchReviews(), fetchProfile()]).then(() => setLoading(false))
  }, [])

  async function fetchBookings() {
    try {
      const res = await fetch("/api/guide/bookings")
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (err) {
      console.error("Error fetching bookings:", err)
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch("/api/guide/profile")
      const data = await res.json()
      if (data.guide?.reviews) setReviews(data.guide.reviews)
    } catch (err) {
      console.error("Error fetching reviews:", err)
    }
  }

  async function fetchProfile() {
    try {
      const res = await fetch("/api/guide/profile")
      const data = await res.json()
      setProfile(data.guide || null)
    } catch (err) {
      console.error("Error fetching profile:", err)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([fetchBookings(), fetchReviews(), fetchProfile()])
    setRefreshing(false)
  }

  const pending = bookings.filter((b) => b.status === "pending").length
  const active = bookings.filter((b) =>
    ["guide_approved", "confirmed"].includes(b.status)
  ).length
  const completed = bookings.filter((b) => b.status === "completed").length
  const earnings = bookings
    .filter((b) => b.status === "completed" && b.payment_status === "paid")
    .reduce((sum, b) => sum + (b.payment_amount || 0), 0)
  const rating = profile?.rating || 0
  const thisMonth = bookings.filter((b) => {
    const d = new Date(b.booking_date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && b.status === "completed"
  }).length

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Loading dashboard...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
              Guide Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Welcome back, {profile?.profiles?.name || "Guide"}
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="mb-8">
          <GuideStatsCards
            stats={{ pending, active, completed, earnings, rating, thisMonth }}
            onGoToProfile={() => setActiveTab("settings")}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto w-auto gap-1 bg-transparent p-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 rounded-xl border border-border/40 bg-background/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-all data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <tab.icon className="size-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0">
            <GuideOverviewTab
              bookings={bookings}
              guideName={profile?.profiles?.name || "Guide"}
              rating={rating}
              onRefresh={fetchBookings}
              onViewAllRequests={() => {
                setBookingsFilterHint({ filter: "pending", nonce: Date.now() })
                setActiveTab("bookings")
              }}
            />
          </TabsContent>

          <TabsContent value="bookings" className="mt-0">
            <GuideBookingsTab
              bookings={bookings}
              onRefresh={fetchBookings}
              filterHint={bookingsFilterHint}
            />
          </TabsContent>

          <TabsContent value="treks" className="mt-0">
            <GuideTreksTab bookings={bookings} />
          </TabsContent>

          <TabsContent value="earnings" className="mt-0">
            <GuideEarningsTab bookings={bookings} />
          </TabsContent>

          <TabsContent value="reviews" className="mt-0">
            <GuideReviewsTab reviews={reviews} />
          </TabsContent>

          <TabsContent value="availability" className="mt-0">
            <GuideAvailabilityCalendar bookings={bookings} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <GuideSettingsTab profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
