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
    // Create Cashfree order
    const orderRequest = {
      order_amount: amount,
      order_currency: "INR",
      order_id: `booking_${booking_id}_${Date.now()}`,
      customer_details: {
        customer_id: user.id,
        customer_name: user.user_metadata?.name || "Trekker",
        customer_email: user.email,
        customer_phone: user.user_metadata?.phone || "",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bookings/${booking_id}?payment=success`,
        payment_methods: "cc,dc,upi,netbanking"
      },
      order_note: `Payment for trek booking #${booking_id} - ${booking.trek_id} on ${booking.booking_date}`
    }

    const response = await cashfree.orders.createOrder(orderRequest)

    // Store payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .upsert({
        id: response.data.order_id,
        booking_id: booking_id,
        user_id: user.id,
        amount: amount,
        currency: "INR",
        status: "pending",
        cashfree_order_id: response.data.order_id,
        created_at: new Date().toISOString(),
      }, { onConflict: "id" })

    if (paymentError) {
      console.error("Error storing payment record:", paymentError)
    }

    return NextResponse.json({
      order_id: response.data.order_id,
      order_amount: response.data.order_amount,
      order_currency: response.data.order_currency,
      payment_session_id: response.data.payment_session_id,
    })

  } catch (error: any) {
    console.error("Cashfree order creation error:", error)
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 })
  }
}, { source: "payments.createOrder", route: "/api/payments/create-order" })
