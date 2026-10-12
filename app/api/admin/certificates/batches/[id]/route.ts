import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateBatchModel from "@/models/CertificateBatch";
import CertificateRecipientModel from "@/models/CertificateRecipient";
import CertificateEmailAttemptModel from "@/models/CertificateEmailAttempt";
import { deleteCertificateFile } from "@/lib/storage/certificate-storage";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * GET /api/admin/certificates/batches/[id]
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ success: false, error: "Invalid batch ID" }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const batch = await CertificateBatchModel.findById(params.id).lean();
    if (!batch) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    // Refresh live counts
    const [totalParticipants, genStats, emailStats] = await Promise.all([
      CertificateRecipientModel.countDocuments({ batchId: params.id }),
      CertificateRecipientModel.aggregate([
        { $match: { batchId: new mongoose.Types.ObjectId(params.id) } },
        {
          $group: {
            _id: "$generationStatus",
            count: { $sum: 1 },
          },
        },
      ]),
      CertificateRecipientModel.aggregate([
        { $match: { batchId: new mongoose.Types.ObjectId(params.id) } },
        {
          $group: {
            _id: "$emailStatus",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const generationCounts = {
      total: totalParticipants,
      generated: genStats.find((s) => s._id === "generated")?.count || 0,
      failed: genStats.find((s) => s._id === "failed")?.count || 0,
    };

    const emailCounts = {
      total: totalParticipants,
      sent: emailStats.find((s) => s._id === "sent")?.count || 0,
      failed: emailStats.find((s) => s._id === "failed")?.count || 0,
      pending: emailStats.find((s) => s._id === "pending")?.count || 0,
    };

    return NextResponse.json({
      success: true,
      batch: {
        ...batch,
        totalParticipants,
        generationCounts,
        emailCounts,
      },
    });
  } catch (error: any) {
    console.error("[GET BATCH ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch batch" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/certificates/batches/[id]
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ success: false, error: "Invalid batch ID" }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const batch = await CertificateBatchModel.findById(params.id);
    if (!batch) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    if (body.batchName) batch.batchName = body.batchName.trim();
    if (body.eventName) batch.eventName = body.eventName.trim();
    if (body.eventDate !== undefined) batch.eventDate = body.eventDate;
    if (body.certificateType !== undefined) batch.certificateType = body.certificateType;
    if (body.emailSubject) batch.emailSubject = body.emailSubject;
    if (body.emailBody) batch.emailBody = body.emailBody;
    if (body.status) batch.status = body.status;
    if (body.templateSnapshot) batch.templateSnapshot = body.templateSnapshot;

    await batch.save();

    return NextResponse.json({
      success: true,
      batch,
      message: "Batch updated successfully.",
    });
  } catch (error: any) {
    console.error("[UPDATE BATCH ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update batch" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/certificates/batches/[id]
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ success: false, error: "Invalid batch ID" }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const batch = await CertificateBatchModel.findById(params.id);
    if (!batch) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    // Clean up stored files for generated certificates
    const recipients = await CertificateRecipientModel.find({ batchId: params.id }).select(
      "certificateFileReference"
    );
    for (const r of recipients) {
      if (r.certificateFileReference) {
        await deleteCertificateFile(r.certificateFileReference);
      }
    }

    // Delete recipients and audit attempts
    await Promise.all([
      CertificateRecipientModel.deleteMany({ batchId: params.id }),
      CertificateEmailAttemptModel.deleteMany({ batchId: params.id }),
      CertificateBatchModel.findByIdAndDelete(params.id),
    ]);

    return NextResponse.json({
      success: true,
      message: "Batch and associated certificates deleted successfully.",
    });
  } catch (error: any) {
    console.error("[DELETE BATCH ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete batch" },
      { status: 500 }
    );
  }
}
