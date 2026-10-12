import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateBatchModel from "@/models/CertificateBatch";
import CertificateRecipientModel from "@/models/CertificateRecipient";
import { parseAndValidateSpreadsheet } from "@/lib/certificates/spreadsheet-parser";
import { generateCertificateId } from "@/lib/certificates/pdf-engine";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: Params) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sheetName = formData.get("sheetName") as string | null;
    const nameColumn = formData.get("nameColumn") as string | null;
    const emailColumn = formData.get("emailColumn") as string | null;
    const typeColumn = formData.get("typeColumn") as string | null;
    const allowDuplicates = formData.get("allowDuplicates") === "true";
    const dryRun = formData.get("dryRun") === "true";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No spreadsheet file provided." },
        { status: 400 }
      );
    }

    if (!nameColumn || !emailColumn) {
      return NextResponse.json(
        { success: false, error: "Name and Email column mappings are required." },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    const validationReport = parseAndValidateSpreadsheet(rawBuffer, {
      sheetName: sheetName || undefined,
      nameColumn,
      emailColumn,
      typeColumn: typeColumn || undefined,
      allowDuplicates,
    });

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        report: validationReport,
      });
    }

    // Filter valid rows for import
    const validRowsToImport = validationReport.rows.filter((r) => r.isValid);

    if (validRowsToImport.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid participant records found in the spreadsheet to import.",
          report: validationReport,
        },
        { status: 400 }
      );
    }

    // Prevent accidental duplication: remove existing pending recipients if re-importing
    await CertificateRecipientModel.deleteMany({
      batchId: batch._id,
      generationStatus: { $ne: "generated" },
    });

    const year = batch.eventDate
      ? parseInt(batch.eventDate.substring(0, 4), 10) || new Date().getFullYear()
      : new Date().getFullYear();

    const recipientDocs = validRowsToImport.map((row) => ({
      batchId: batch._id,
      sourceRowNumber: row.rowNumber,
      participantName: row.mappedName!,
      email: row.mappedEmail!,
      certificateId: generateCertificateId(year),
      certificateType: row.mappedType || batch.certificateType,
      additionalFields: row.data,
      generationStatus: "pending",
      emailStatus: "pending",
      emailAttempts: 0,
    }));

    await CertificateRecipientModel.insertMany(recipientDocs);

    // Update batch totals
    batch.totalParticipants = validRowsToImport.length;
    batch.validParticipants = validationReport.validRows;
    batch.invalidParticipants = validationReport.invalidRows;
    batch.status = "ready";
    batch.generationCounts = {
      total: validRowsToImport.length,
      generated: 0,
      failed: 0,
    };
    batch.emailCounts = {
      total: validRowsToImport.length,
      sent: 0,
      failed: 0,
      pending: validRowsToImport.length,
    };
    await batch.save();

    return NextResponse.json({
      success: true,
      importedCount: validRowsToImport.length,
      report: validationReport,
      message: `Successfully imported ${validRowsToImport.length} participant records.`,
    });
  } catch (error: any) {
    console.error("[IMPORT RECIPIENTS ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import recipients" },
      { status: 500 }
    );
  }
}
