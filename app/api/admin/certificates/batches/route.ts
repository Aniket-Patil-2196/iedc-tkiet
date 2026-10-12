import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateBatchModel from "@/models/CertificateBatch";
import CertificateRecipientModel from "@/models/CertificateRecipient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/certificates/batches
 * Returns paginated batches list and overall stats.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.trim();

    const query: any = {};
    if (search) {
      query.$or = [
        { batchName: { $regex: search, $options: "i" } },
        { eventName: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [batches, totalBatches] = await Promise.all([
      CertificateBatchModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CertificateBatchModel.countDocuments(query),
    ]);

    // Aggregate overall statistics across all batches
    const statsAggregate = await CertificateBatchModel.aggregate([
      {
        $group: {
          _id: null,
          totalBatches: { $sum: 1 },
          totalParticipants: { $sum: "$totalParticipants" },
          totalGenerated: { $sum: "$generationCounts.generated" },
          totalEmailsSent: { $sum: "$emailCounts.sent" },
          totalEmailsFailed: { $sum: "$emailCounts.failed" },
          totalEmailsPending: { $sum: "$emailCounts.pending" },
        },
      },
    ]);

    const stats = statsAggregate[0] || {
      totalBatches: 0,
      totalParticipants: 0,
      totalGenerated: 0,
      totalEmailsSent: 0,
      totalEmailsFailed: 0,
      totalEmailsPending: 0,
    };

    return NextResponse.json({
      success: true,
      batches,
      pagination: {
        page,
        limit,
        totalBatches,
        totalPages: Math.ceil(totalBatches / limit),
      },
      stats,
    });
  } catch (error: any) {
    console.error("[GET BATCHES ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/certificates/batches
 * Creates a new certificate batch.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      batchName,
      eventId,
      eventName,
      eventDate,
      certificateType,
      templateSnapshot,
      emailSubject,
      emailBody,
    } = body;

    if (!batchName || !eventName || !templateSnapshot) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch Name, Event Name, and Template Configuration are required.",
        },
        { status: 400 }
      );
    }

    // Require participantName field in template
    const hasNameField = templateSnapshot.fields?.some(
      (f: any) => f.fieldKey === "participantName"
    );
    if (!hasNameField) {
      return NextResponse.json(
        {
          success: false,
          error: "Template configuration must include a Participant Name field.",
        },
        { status: 400 }
      );
    }

    const newBatch = await CertificateBatchModel.create({
      batchName: batchName.trim(),
      eventId: eventId || undefined,
      eventName: eventName.trim(),
      eventDate: eventDate?.trim() || undefined,
      certificateType: certificateType?.trim() || "Participation",
      templateSnapshot,
      emailSubject:
        emailSubject?.trim() || "Your Certificate of Participation — {{eventName}}",
      emailBody:
        emailBody?.trim() ||
        "Dear {{participantName}},\n\nThank you for participating in {{eventName}} organized by IEDC TKIET.\n\nPlease find your personalized certificate attached to this email.\n\nCertificate ID: {{certificateId}}\n\nWe appreciate your participation and look forward to seeing you at our future events.\n\nRegards,\nInnovation and Entrepreneurship Development Cell (IEDC)\nTKIET",
      status: "draft",
      createdBy: session.email,
    });

    return NextResponse.json({
      success: true,
      batch: newBatch,
      message: "Certificate batch created successfully.",
    });
  } catch (error: any) {
    console.error("[CREATE BATCH ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create batch" },
      { status: 500 }
    );
  }
}
