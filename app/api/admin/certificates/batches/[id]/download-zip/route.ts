import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateBatchModel from "@/models/CertificateBatch";
import CertificateRecipientModel from "@/models/CertificateRecipient";
import { getCertificateFile } from "@/lib/storage/certificate-storage";
import { renderCertificatePdf } from "@/lib/certificates/pdf-engine";
import { sanitizeForCsv } from "@/lib/certificates/spreadsheet-parser";
import JSZip from "jszip";
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

    const recipients = await CertificateRecipientModel.find({ batchId: params.id })
      .sort({ sourceRowNumber: 1 })
      .lean();

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients found in this batch." },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const certsFolder = zip.folder("certificates");

    // Build Manifest CSV
    const csvRows = [
      "Row,Name,Email,Certificate ID,Type,Generation Status,Email Status",
    ];

    let templateBuffer: Buffer | null = null;
    const templateFile = await getCertificateFile(
      batch.templateSnapshot.fileReference
    );
    if (templateFile) {
      templateBuffer = templateFile.buffer;
    }

    for (const r of recipients) {
      const rowNum = sanitizeForCsv(r.sourceRowNumber);
      const name = sanitizeForCsv(r.participantName);
      const email = sanitizeForCsv(r.email);
      const certId = sanitizeForCsv(r.certificateId);
      const type = sanitizeForCsv(r.certificateType || batch.certificateType);
      const genStatus = sanitizeForCsv(r.generationStatus);
      const emailStatus = sanitizeForCsv(r.emailStatus);

      csvRows.push(
        `"${rowNum}","${name}","${email}","${certId}","${type}","${genStatus}","${emailStatus}"`
      );

      let pdfBuffer: Buffer | null = null;
      if (r.certificateFileReference) {
        const fileData = await getCertificateFile(r.certificateFileReference);
        if (fileData) {
          pdfBuffer = fileData.buffer;
        }
      }

      // If not yet saved or generated, render on-the-fly
      if (!pdfBuffer && templateBuffer) {
        try {
          pdfBuffer = await renderCertificatePdf(
            templateBuffer,
            batch.templateSnapshot,
            {
              participantName: r.participantName,
              certificateId: r.certificateId,
              eventName: batch.eventName,
              eventDate: batch.eventDate,
              certificateType: r.certificateType || batch.certificateType,
              additionalFields: r.additionalFields ? (r.additionalFields as any) : {},
            }
          );
        } catch (renderErr) {
          console.warn("[ZIP GENERATE FALLBACK ERR]", renderErr);
        }
      }

      if (pdfBuffer && certsFolder) {
        const safeName = `IEDC_TKIET_Certificate_${r.certificateId.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        certsFolder.file(safeName, pdfBuffer);
      }
    }

    zip.file("manifest.csv", csvRows.join("\n"));

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const safeBatchName = batch.batchName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const zipFilename = `IEDC_TKIET_Certificates_${safeBatchName}.zip`;

    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("[ZIP DOWNLOAD ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate ZIP archive" },
      { status: 500 }
    );
  }
}
