import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import RegistrationModel from "@/models/Registration";
import { getRazorpayClient } from "@/lib/razorpay/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    // 1. Verify Admin Session
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason?.trim() || "Admin initiated manual refund";

    // 2. Connect to Database
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database temporarily unavailable" },
        { status: 503 }
      );
    }

    // 3. Find registration
    const registration = await RegistrationModel.findById(id);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found" },
        { status: 404 }
      );
    }

    // 4. Validate registration status
    if (registration.status === "refunded") {
      return NextResponse.json(
        {
          success: false,
          error: `This registration is already refunded (Refund ID: ${registration.refundId || "N/A"}).`,
        },
        { status: 400 }
      );
    }

    if (registration.status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          error: `Only registrations with 'paid' status can be refunded (current status: ${registration.status}).`,
        },
        { status: 400 }
      );
    }

    // 5. If Free event (amount === 0, no payment gateway ID), mark refunded directly
    if (registration.amount === 0 || !registration.razorpayPaymentId) {
      registration.status = "refunded";
      registration.refundId = `FREE-REFUND-${Date.now()}`;
      registration.refundedAt = new Date();
      await registration.save();

      return NextResponse.json({
        success: true,
        message: "Free registration marked as cancelled/refunded.",
        refundId: registration.refundId,
        refundedAt: registration.refundedAt,
      });
    }

    // 6. Call Razorpay Refunds API
    const razorpay = getRazorpayClient();
    const paymentId = registration.razorpayPaymentId;

    const refund = await razorpay.payments.refund(paymentId, {
      notes: {
        reason,
        registrationId: registration._id.toString(),
        adminEmail: session.email,
      },
    });

    if (!refund || !refund.id) {
      throw new Error("Razorpay did not return a valid refund confirmation.");
    }

    // 7. Update Registration record ONLY after Razorpay confirms
    registration.status = "refunded";
    registration.refundId = refund.id;
    registration.refundedAt = new Date();
    await registration.save();

    console.log(
      `[ADMIN MANUAL REFUND] Payment ${paymentId} refunded by ${session.email}. Refund ID: ${refund.id}`
    );

    return NextResponse.json({
      success: true,
      message: "Refund successfully processed and confirmed by Razorpay.",
      refundId: refund.id,
      refundedAt: registration.refundedAt,
    });
  } catch (error: any) {
    console.error("[ADMIN REFUND ROUTE ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process refund with Razorpay.",
      },
      { status: 500 }
    );
  }
}
