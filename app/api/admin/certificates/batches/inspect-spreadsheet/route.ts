import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { inspectSpreadsheet } from "@/lib/certificates/spreadsheet-parser";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SPREADSHEET_SIZE = 10 * 1024 * 1024; // 10MB limit

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No spreadsheet file was provided." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SPREADSHEET_SIZE) {
      return NextResponse.json(
        { success: false, error: "Spreadsheet exceeds the 10MB size limit." },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Inspect sheets and headers
    const inspection = inspectSpreadsheet(rawBuffer);

    // Read first sheet sample rows
    const workbook = XLSX.read(rawBuffer, { type: "buffer", cellFormula: false });
    const firstSheetName = inspection.sheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const sampleRows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      blankrows: false,
      raw: false,
    }).slice(0, 5);

    return NextResponse.json({
      success: true,
      sheetNames: inspection.sheetNames,
      headers: inspection.firstSheetHeaders,
      suggestedMapping: inspection.suggestedMapping,
      sampleRows,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error("[INSPECT SPREADSHEET ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to inspect spreadsheet" },
      { status: 500 }
    );
  }
}
