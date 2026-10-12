import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateBatchModel from "@/models/CertificateBatch";
import CertificateRecipientModel from "@/models/CertificateRecipient";
import { renderCertificatePdf, generateCertificateId } from "@/lib/certificates/pdf-engine";
import { getCertificateFile } from "@/lib/storage/certificate-storage";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

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

    const batch = await CertificateBatchModel.findById(params.id);
    if (!batch) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    const templateFile = await getCertificateFile(
      batch.templateSnapshot.fileReference
    );
    if (!templateFile) {
      return NextResponse.json(
        { success: false, error: "Template file not found in storage" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const recipientId = searchParams.get("recipientId");
    const previewName = searchParams.get("name") || "Dr. Rajesh Sharma";

    let participantName = previewName;
    let certificateId = generateCertificateId(new Date().getFullYear());
    let certType = batch.certificateType || "Participation";

    if (recipientId && mongoose.isValidObjectId(recipientId)) {
      const recipient = await CertificateRecipientModel.findById(recipientId);
      if (recipient) {
        participantName = recipient.participantName;
        certificateId = recipient.certificateId;
        certType = recipient.certificateType || certType;
      }
    }

    const pdfBuffer = await renderCertificatePdf(
      templateFile.buffer,
      batch.templateSnapshot,
      {
        participantName,
        certificateId,
        eventName: batch.eventName,
        eventDate: batch.eventDate,
        certificateType: certType,
        issueDate: new Date().toLocaleDateString("en-IN"),
      }
    );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="certificate_preview.pdf"',
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[PREVIEW CERTIFICATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate preview" },
      { status: 500 }
    );
  }
}
