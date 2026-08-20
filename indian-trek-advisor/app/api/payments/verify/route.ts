import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-admin"
import { cashfree, validateCashfreeConfig } from "@/lib/cashfree/config"
import { withErrorHandling } from "@/lib/api"

export const POST = withErrorHandling(async function POST(request: Request) {
  validateCashfreeConfig()

  const supabase = getAdminClient()
  const body = await request.json()
  const { order_id } = body

  if (!order_id) {
    return NextResponse.json({ error: "order_id is required" }, { status: 400 })
  }

  try {
    // Verify payment with Cashfree (v6 SDK method: cashfree.PGFetchOrder)
    const response = await cashfree.PGFetchOrder(order_id, undefined, undefined)
    const order = response.data

    if (order.order_status === "PAID") {
      // Update payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "completed",
          payment_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("cashfree_order_id", order_id)

      if (paymentError) {
        console.error("Error updating payment record:", paymentError)
      }

      // Get booking_id from payment record
      const { data: payment } = await supabase
        .from("payments")
        .select("booking_id")
        .eq("cashfree_order_id", order_id)
        .single()

      if (payment) {
        // Update booking payment status
        await supabase
          .from("bookings")
          .update({ payment_status: "paid" })
          .eq("id", payment.booking_id)
      }

      return NextResponse.json({ success: true, order_status: order.order_status })
    } else {
      // Update payment record with failed status
      await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("cashfree_order_id", order_id)

      return NextResponse.json({ success: false, order_status: order.order_status })
    }

  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message
    console.error("Cashfree payment verification error:", message)
    return NextResponse.json(
      { error: message || "Failed to verify payment" },
      { status: 500 },
    )
  }
}, { source: "payments.verify", route: "/api/payments/verify" })
