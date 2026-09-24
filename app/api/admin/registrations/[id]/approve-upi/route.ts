import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import RegistrationModel from "@/models/Registration";
import { getNextReceiptNumber } from "@/models/Counter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * Approves initial UPI payment proof:
 * - Full payment → mark paid + issue receipt
 * - Installment Part 1 → mark part1_paid (Part 2 uses /approve-part2)
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

    if (registration.status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Already approved and marked as paid.",
        receiptNumber: registration.receiptNumber,
      });
    }

    if (registration.installmentStatus === "part2_pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Use the Part 2 approval endpoint for this registration.",
        },
        { status: 400 }
      );
    }

    const reviewable =
      registration.status === "verification_required" || registration.status === "pending";
    if (!reviewable) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot approve registration with status '${registration.status}'.`,
        },
        { status: 400 }
      );
    }

    const isInstallment = registration.installmentPlan === "installment";
    const adminEmail = session.email || "admin";

    if (isInstallment) {
      if (
        registration.installmentStatus === "part1_pending" ||
        !registration.installmentStatus
      ) {
        registration.installmentStatus = "part1_paid";
        registration.part1PaidAt = new Date();
        registration.verifiedAt = new Date();
        registration.verifiedBy = adminEmail;
        registration.status = "verification_required";
        if (adminNote) registration.adminNote = adminNote;
        registration.rejectionReason = null as any;
        await registration.save();

        return NextResponse.json({
          success: true,
          status: "verification_required",
          installmentStatus: "part1_paid",
          message: "Part 1 payment approved. Participant is now eligible to submit Part 2.",
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: `Cannot approve at installment stage '${registration.installmentStatus}'.`,
        },
        { status: 400 }
      );
    }

    // Full payment plan approval — issue receipt number only on approval
    let receiptNumber = registration.receiptNumber;
    if (!receiptNumber) {
      receiptNumber = await getNextReceiptNumber();
    }

    registration.status = "paid";
    registration.installmentStatus = "complete";
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
      receiptNumber,
      message: "Payment verified and registration approved as paid.",
    });
  } catch (error: any) {
    console.error("[UPI APPROVE ROUTE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve registration." },
      { status: 500 }
    );
  }
}
