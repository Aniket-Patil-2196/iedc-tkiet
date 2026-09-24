import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import RegistrationModel from "@/models/Registration";
import EventModel from "@/models/Event";
import { getNextReceiptNumber } from "@/models/Counter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * Approves Installment Part 2 UPI proof → marks registration fully paid + issues receipt.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const adminNote: string | undefined = body?.adminNote;

    const registration = await RegistrationModel.findById(params.id);
    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found." }, { status: 404 });
    }

    if (registration.paymentMethod !== "MANUAL_UPI" && registration.paymentMode !== "manual_upi") {
      return NextResponse.json(
        { success: false, error: "Not a manual UPI registration." },
        { status: 400 }
      );
    }

    if (registration.status === "paid" && registration.installmentStatus === "complete") {
      return NextResponse.json({
        success: true,
        message: "Already fully approved.",
        receiptNumber: registration.receiptNumber,
      });
    }

    if (
      registration.installmentPlan !== "installment" ||
      registration.installmentStatus !== "part2_pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration is not awaiting Part 2 approval.",
        },
        { status: 400 }
      );
    }

    // Server-side: set amount to full snapshotted fee (fallback to live event fee)
    let fullAmountPaise = registration.totalAmount;
    if (fullAmountPaise == null || fullAmountPaise <= 0) {
      const event = await EventModel.findById(registration.eventId);
      if (event && event.fee !== undefined) {
        fullAmountPaise = Math.floor(event.fee) * 100;
      } else {
        fullAmountPaise = registration.amount;
      }
    }

    let receiptNumber = registration.receiptNumber;
    if (!receiptNumber) {
      receiptNumber = await getNextReceiptNumber();
    }

    const adminEmail = session.email || "admin";

    registration.amount = fullAmountPaise;
    registration.totalAmount = fullAmountPaise;
    registration.status = "paid";
    registration.installmentStatus = "complete";
    registration.part2PaidAt = new Date();
    registration.paidAt = new Date();
    registration.verifiedAt = new Date();
    registration.verifiedBy = adminEmail;
    registration.receiptNumber = receiptNumber;
    if (adminNote) registration.adminNote = adminNote;
    registration.rejectionReason = null as any;
    await registration.save();

    return NextResponse.json({
      success: true,
      status: "paid",
      installmentStatus: "complete",
      receiptNumber,
      message: "Part 2 payment approved. Registration fully marked as paid.",
    });
  } catch (error: any) {
    console.error("[UPI APPROVE PART2 ROUTE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve Part 2 payment." },
      { status: 500 }
    );
  }
}
