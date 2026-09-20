import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import RegistrationModel from "@/models/Registration";
import EventModel from "@/models/Event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
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
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const query: any = {};

    if (eventId && eventId !== "all") {
      query.eventId = eventId;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { college: searchRegex },
        { receiptNumber: searchRegex },
        { razorpayPaymentId: searchRegex },
        { razorpayOrderId: searchRegex },
      ];
    }

    // 4. Fetch registrations with sorting (newest first)
    const registrations = await RegistrationModel.find(query)
      .sort({ createdAt: -1 })
      .populate("eventId", "title slug startDate venue fee")
      .lean();

    // 5. Compute summary metrics across all records or for selected event
    const metricsFilter: any = {};
    if (eventId && eventId !== "all") {
      metricsFilter.eventId = eventId;
    }

    const allRecords = await RegistrationModel.find(
      metricsFilter,
      "amount status createdAt"
    ).lean();

    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    let totalRevenuePaise = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let refundedCount = 0;
    let failedCount = 0;
    let stalePendingCount = 0;

    for (const record of allRecords) {
      if (record.status === "paid") {
        paidCount++;
        totalRevenuePaise += record.amount || 0;
      } else if (record.status === "pending") {
        pendingCount++;
        if (new Date(record.createdAt).getTime() < fifteenMinutesAgo) {
          stalePendingCount++;
        }
      } else if (record.status === "refunded") {
        refundedCount++;
      } else if (record.status === "failed") {
        failedCount++;
      }
    }

    // 6. Fetch events list for filter dropdown
    const events = await EventModel.find({}, "title slug startDate")
      .sort({ startDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: registrations,
      metrics: {
        totalRegistrations: allRecords.length,
        paidCount,
        totalRevenueRupees: Math.round(totalRevenuePaise / 100),
        pendingCount,
        refundedCount,
        failedCount,
        stalePendingCount,
      },
      events: events.map((e: any) => ({
        id: e._id.toString(),
        title: e.title,
        slug: e.slug,
        startDate: e.startDate,
      })),
    });
  } catch (error: any) {
    console.error("[ADMIN REGISTRATIONS GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
