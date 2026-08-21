"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { IndianRupee, Loader2, AlertCircle, Phone } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface PaymentModalProps {
  bookingId: string
  amount: number
  trekName: string
  bookingDate: string
  numPeople?: number
  totalAmount?: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({
  bookingId,
  amount,
  trekName,
  bookingDate,
  numPeople,
  totalAmount,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [hasPhone, setHasPhone] = useState(false)
  const [savingPhone, setSavingPhone] = useState(false)

  // Check if user has phone number when modal opens
  useEffect(() => {
    if (isOpen) {
      checkUserPhone()
    }
  }, [isOpen])

  const checkUserPhone = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .single()

    if (profile?.phone) {
      setPhoneNumber(profile.phone)
      setHasPhone(true)
    }
  }

  const handleSavePhone = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setSavingPhone(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone: phoneNumber })
        .eq("id", user.id)

      if (updateError) throw updateError

      setHasPhone(true)
    } catch (err: any) {
      setError(err.message || "Failed to save phone number")
    } finally {
      setSavingPhone(false)
    }
  }

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment order")
      }

      // Initialize Cashfree checkout (v3 SDK): window.Cashfree is a factory
      // function invoked as Cashfree({ mode }) — NOT `new`. Mode must be the
      // lowercase "sandbox" / "production" values the SDK expects.
      const CashfreeCtor = (window as any).Cashfree
      if (typeof CashfreeCtor !== "function") {
        throw new Error("Payment gateway not loaded")
      }
      const cashfree = CashfreeCtor({ mode: data.mode || "sandbox" })

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      }

      cashfree.checkout(checkoutOptions).then((result: any) => {
        if (result.redirect) {
          // Payment completed, verify and update
          verifyPayment(data.order_id)
        } else if (result.error) {
          setError(result.error.message || "Payment failed")
          setLoading(false)
        }
      })

    } catch (err: any) {
      setError(err.message || "Failed to initiate payment")
      setLoading(false)
    }
  }

  const verifyPayment = async (orderId: string) => {
    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError("Payment verification failed")
        setLoading(false)
      }
    } catch (err: any) {
      setError("Failed to verify payment")
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Complete Payment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Secure payment via Cashfree
          </p>
        </div>

        <div className="mb-6 space-y-4 rounded-lg border border-border bg-background p-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Trek</span>
            <span className="text-sm font-medium text-foreground">{trekName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Date</span>
            <span className="text-sm font-medium text-foreground">{bookingDate}</span>
          </div>
          {numPeople && numPeople > 1 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">People</span>
              <span className="text-sm font-medium text-foreground">{numPeople}</span>
            </div>
          )}
          {totalAmount && totalAmount !== amount && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Approximate total</span>
              <span className="font-mono">{totalAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-4">
            <span className="text-sm font-medium text-foreground">Pay Booking Fee</span>
            <div className="flex items-center gap-1">
              <IndianRupee className="size-4 text-primary" />
              <span className="text-lg font-bold text-primary">{amount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {!hasPhone && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-2 mb-3">
              <Phone className="size-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Phone Number Required</p>
                <p className="text-xs text-muted-foreground mt-1">Please provide your phone number for payment processing and booking notifications.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSavePhone}
                disabled={savingPhone || !phoneNumber || phoneNumber.length < 10}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-background transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {savingPhone ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <AlertCircle className="size-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || !hasPhone}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay Now"
            )}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Payments are secured by Cashfree. Your payment information is encrypted.
        </p>
      </motion.div>
    </div>
  )
}
