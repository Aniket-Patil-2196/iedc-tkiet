import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { parseAndValidateSpreadsheet } from "@/lib/certificates/spreadsheet-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sheetName = formData.get("sheetName") as string | null;
    const nameColumn = formData.get("nameColumn") as string | null;
    const emailColumn = formData.get("emailColumn") as string | null;
    const typeColumn = formData.get("typeColumn") as string | null;
    const allowDuplicates = formData.get("allowDuplicates") === "true";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No spreadsheet file was provided." },
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

    return NextResponse.json({
      success: true,
      report: validationReport,
    });
  } catch (error: any) {
    console.error("[VALIDATE SPREADSHEET ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate spreadsheet" },
      { status: 500 }
    );
  }
}
