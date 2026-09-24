import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import RegistrationModel from "@/models/Registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

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
    const rejectionReason: string = (
      body?.rejectionReason ||
      body?.reason ||
      ""
    )
      .toString()
      .trim();

    if (!rejectionReason) {
      return NextResponse.json(
        { success: false, error: "A non-empty rejection reason is required." },
        { status: 400 }
      );
    }

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

    const rejectableStatuses = new Set(["verification_required", "pending"]);
    // part1_paid still has status verification_required — also allow reject mid-installment
    if (!rejectableStatuses.has(registration.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reject registration with status '${registration.status}'.`,
        },
        { status: 400 }
      );
    }

    registration.status = "payment_rejected";
    registration.rejectionReason = rejectionReason;
    registration.adminNote = `Rejected: ${rejectionReason}`;
    registration.verifiedAt = new Date();
    registration.verifiedBy = session.email || "admin";
    await registration.save();

    return NextResponse.json({
      success: true,
      message: "Registration rejected successfully.",
      status: "payment_rejected",
    });
  } catch (error: any) {
    console.error("[UPI REJECT ROUTE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reject registration." },
      { status: 500 }
    );
  }
}
