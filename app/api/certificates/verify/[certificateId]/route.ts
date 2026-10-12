import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CertificateRecipientModel from "@/models/CertificateRecipient";
import CertificateBatchModel from "@/models/CertificateBatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { certificateId: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const certId = params.certificateId?.trim().toUpperCase();

    // Basic format validation
    if (!certId || !/^IEDC-TKIET-[A-Z0-9_-]+$/i.test(certId)) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "Invalid certificate identifier format.",
        },
        { status: 400 }
      );
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const recipient = await CertificateRecipientModel.findOne({
      certificateId: certId,
    }).lean();

    if (!recipient) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          error: "Certificate not found or invalid.",
        },
        { status: 404 }
      );
    }

    const batch = await CertificateBatchModel.findById(recipient.batchId).lean();

    return NextResponse.json({
      success: true,
      valid: true,
      certificate: {
        certificateId: recipient.certificateId,
        participantName: recipient.participantName,
        eventName: batch?.eventName || "IEDC TKIET Event",
        eventDate: batch?.eventDate,
        certificateType: recipient.certificateType || batch?.certificateType || "Participation",
        issueDate: recipient.sentAt || recipient.createdAt,
        institution: "Innovation & Entrepreneurship Development Cell (IEDC)",
        college: "Tatyasaheb Kore Institute of Engineering & Technology (TKIET), Warananagar",
      },
    });
  } catch (error: any) {
    console.error("[VERIFY CERTIFICATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify certificate" },
      { status: 500 }
    );
  }
}
