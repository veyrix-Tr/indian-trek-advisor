"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { IndianRupee, Loader2, AlertCircle } from "lucide-react"

interface PaymentModalProps {
  bookingId: string
  amount: number
  trekName: string
  bookingDate: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({
  bookingId,
  amount,
  trekName,
  bookingDate,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      // Initialize Cashfree checkout
      const cashfree = (window as any).Cashfree
      if (!cashfree) {
        throw new Error("Payment gateway not loaded")
      }

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
          <div className="flex justify-between border-t border-border pt-4">
            <span className="text-sm font-medium text-foreground">Total Amount</span>
            <div className="flex items-center gap-1">
              <IndianRupee className="size-4 text-primary" />
              <span className="text-lg font-bold text-primary">{amount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

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
            disabled={loading}
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
