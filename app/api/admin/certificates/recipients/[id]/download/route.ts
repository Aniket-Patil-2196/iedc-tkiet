import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateRecipientModel from "@/models/CertificateRecipient";
import CertificateBatchModel from "@/models/CertificateBatch";
import { getCertificateFile } from "@/lib/storage/certificate-storage";
import { renderCertificatePdf } from "@/lib/certificates/pdf-engine";
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
      return NextResponse.json({ success: false, error: "Invalid recipient ID" }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const recipient = await CertificateRecipientModel.findById(params.id);
    if (!recipient) {
      return NextResponse.json({ success: false, error: "Recipient record not found" }, { status: 404 });
    }

    let pdfBuffer: Buffer | null = null;

    if (recipient.certificateFileReference) {
      const fileData = await getCertificateFile(recipient.certificateFileReference);
      if (fileData) {
        pdfBuffer = fileData.buffer;
      }
    }

    // Fallback on-the-fly rendering if file not in storage
    if (!pdfBuffer) {
      const batch = await CertificateBatchModel.findById(recipient.batchId);
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

      pdfBuffer = await renderCertificatePdf(
        templateFile.buffer,
        batch.templateSnapshot,
        {
          participantName: recipient.participantName,
          certificateId: recipient.certificateId,
          eventName: batch.eventName,
          eventDate: batch.eventDate,
          certificateType: recipient.certificateType || batch.certificateType,
          additionalFields: recipient.additionalFields
            ? recipient.additionalFields instanceof Map
              ? Object.fromEntries(recipient.additionalFields)
              : (recipient.additionalFields as any)
            : {},
        }
      );
    }

    const safeFilename = `IEDC_TKIET_Certificate_${recipient.certificateId.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("[DOWNLOAD CERTIFICATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to download certificate" },
      { status: 500 }
    );
  }
}
