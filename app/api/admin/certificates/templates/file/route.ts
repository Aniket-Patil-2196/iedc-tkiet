import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { getCertificateFile } from "@/lib/storage/certificate-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get("ref");

    if (!ref) {
      return NextResponse.json({ success: false, error: "Missing file reference" }, { status: 400 });
    }

    const fileData = await getCertificateFile(ref);
    if (!fileData) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    return new Response(new Uint8Array(fileData.buffer), {
      status: 200,
      headers: {
        "Content-Type": fileData.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${fileData.filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("[TEMPLATE FILE SERVE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to serve template file" },
      { status: 500 }
    );
  }
}
