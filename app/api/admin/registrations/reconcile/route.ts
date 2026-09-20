import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import RegistrationModel from "@/models/Registration";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { finalizePayment } from "@/lib/razorpay/payment-finalizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // 1. Verify Admin Session
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Connect to Database
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database temporarily unavailable" },
        { status: 503 }
      );
    }

    // 3. Find pending registrations older than 15 minutes that have a razorpayOrderId
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const pendingRegistrations = await RegistrationModel.find({
      status: "pending",
      razorpayOrderId: { $exists: true, $ne: null },
      createdAt: { $lte: fifteenMinutesAgo },
    });

    if (pendingRegistrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stale pending registrations older than 15 minutes found.",
        summary: { checked: 0, finalizedPaid: 0, markedFailed: 0, unchanged: 0 },
      });
    }

    const razorpay = getRazorpayClient();
    let finalizedPaid = 0;
    let markedFailed = 0;
    let unchanged = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const reg of pendingRegistrations) {
      try {
        if (!reg.razorpayOrderId) continue;

        // Fetch payments for this Razorpay order
        const paymentsResponse: any = await razorpay.orders.fetchPayments(reg.razorpayOrderId);
        const payments: any[] = paymentsResponse?.items || [];

        // Check if there is any captured payment
        const capturedPayment = payments.find(
          (p: any) => p.status === "captured" || p.captured === true
        );

        if (capturedPayment) {
          // Use shared finalizePayment
          const result = await finalizePayment(reg, capturedPayment);
          if (result.status === "paid") {
            finalizedPaid++;
          } else {
            // e.g. refunded due to capacity/duplicate
            unchanged++;
          }
          continue;
        }

        // Check if all payment attempts failed
        const allFailed =
          payments.length > 0 && payments.every((p: any) => p.status === "failed");

        const isVeryOld = Date.now() - new Date(reg.createdAt).getTime() > 24 * 60 * 60 * 1000;

        if (allFailed || isVeryOld) {
          reg.status = "failed";
          await reg.save();
          markedFailed++;
        } else {
          unchanged++;
        }
      } catch (err: any) {
        console.error(`[RECONCILE ERROR] Registration ${reg._id}:`, err);
        errors.push({ id: reg._id.toString(), error: err.message || "Failed to reconcile" });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reconciliation complete. Processed ${pendingRegistrations.length} registrations.`,
      summary: {
        checked: pendingRegistrations.length,
        finalizedPaid,
        markedFailed,
        unchanged,
        errorsCount: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[ADMIN RECONCILE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run reconciliation." },
      { status: 500 }
    );
  }
}
