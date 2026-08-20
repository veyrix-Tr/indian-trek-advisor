import { NextResponse } from "next/server"
import { getAdminClient, getAuthUser } from "@/lib/supabase-admin"
import { cashfree, validateCashfreeConfig } from "@/lib/cashfree/config"
import { withErrorHandling } from "@/lib/api"

export const POST = withErrorHandling(async function POST(request: Request) {
  validateCashfreeConfig()

  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()
  const body = await request.json()
  const { booking_id } = body

  if (!booking_id) {
    return NextResponse.json({ error: "booking_id is required" }, { status: 400 })
  }

  // Fetch booking details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", booking_id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  // Verify booking belongs to user
  if (booking.trekker_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Verify booking is in guide_approved state (ready for payment)
  if (booking.status !== "guide_approved") {
    return NextResponse.json({ error: "Booking must be approved by guide before payment" }, { status: 400 })
  }

  // Check if payment already exists
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", booking_id)
    .single()

  if (existingPayment && existingPayment.status === "completed") {
    return NextResponse.json({ error: "Payment already completed" }, { status: 400 })
  }

  const amount = Number(booking.total_amount)
  if (amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }

  try {
    // Fetch user's phone number from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .single()

    const phoneNumber = profile?.phone || user.user_metadata?.phone || ""

    // Cashfree requires a valid 10-digit customer_phone; fall back to a
    // placeholder when the trekker hasn't saved one yet.
    const sanitizedPhone = String(phoneNumber).replace(/[^\d]/g, "")
    const customerPhone = /^[6-9]\d{9}$/.test(sanitizedPhone) ? sanitizedPhone : "9999999999"

    // Create Cashfree order (v6 SDK method: cashfree.PGCreateOrder)
    const order_id = `booking_${booking_id}_${Date.now()}`
    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"
    const orderRequest = {
      order_amount: amount,
      order_currency: "INR",
      order_id,
      customer_details: {
        customer_id: user.id,
        customer_name: user.user_metadata?.name || "Trekker",
        customer_email: user.email,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${appUrl}/dashboard/bookings?payment=success&order_id=${order_id}&booking_id=${booking_id}`,
        payment_methods: "cc,dc,upi,nb",
      },
      order_note: `Payment for trek booking #${booking_id} - ${booking.trek_id} on ${booking.booking_date}`,
    }

    const response = await cashfree.PGCreateOrder(orderRequest, undefined, undefined)
    const order = response.data

    // Store payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .upsert({
        id: order.order_id,
        booking_id: booking_id,
        user_id: user.id,
        amount: amount,
        currency: "INR",
        status: "pending",
        cashfree_order_id: order.order_id,
        created_at: new Date().toISOString(),
      }, { onConflict: "id" })

    if (paymentError) {
      console.error("Error storing payment record:", paymentError)
    }

    return NextResponse.json({
      order_id: order.order_id,
      order_amount: order.order_amount,
      order_currency: order.order_currency,
      payment_session_id: order.payment_session_id,
      mode: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox",
    })

  } catch (error: any) {
    // Surface the gateway's message when available so failures are debuggable.
    const message = error?.response?.data?.message || error?.message
    console.error("Cashfree order creation error:", message)
    return NextResponse.json(
      { error: message || "Failed to create payment order" },
      { status: 500 },
    )
  }
}, { source: "payments.createOrder", route: "/api/payments/create-order" })
