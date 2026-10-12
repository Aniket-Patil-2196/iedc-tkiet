import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateTemplateModel from "@/models/CertificateTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/certificates/templates
 * Lists saved certificate templates.
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

    const templates = await CertificateTemplateModel.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error("[GET TEMPLATES ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/certificates/templates
 * Saves a certificate template for future reuse.
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
      name,
      fileReference,
      fileName,
      mimeType,
      pageWidth,
      pageHeight,
      orientation,
      fields,
    } = body;

    if (!name || !fileReference || !fields || fields.length === 0) {
      return NextResponse.json(
        { success: false, error: "Name, template file reference, and fields are required." },
        { status: 400 }
      );
    }

    const template = await CertificateTemplateModel.create({
      name: name.trim(),
      fileReference,
      fileName: fileName || "template.pdf",
      mimeType: mimeType || "application/pdf",
      pageWidth: pageWidth || 842,
      pageHeight: pageHeight || 595,
      orientation: orientation || "landscape",
      fields,
      createdBy: session.email,
    });

    return NextResponse.json({
      success: true,
      template,
      message: "Certificate template saved successfully for future reuse.",
    });
  } catch (error: any) {
    console.error("[SAVE TEMPLATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save template" },
      { status: 500 }
    );
  }
}
