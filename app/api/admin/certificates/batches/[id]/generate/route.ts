import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { processBatchGeneration } from "@/lib/certificates/batch-processor";
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

    const body = await request.json().catch(() => ({}));
    const forceRegenerate = body.forceRegenerate === true;
    const maxCount = body.maxCount ? parseInt(body.maxCount, 10) : undefined;

    const result = await processBatchGeneration(params.id, {
      forceRegenerate,
      maxCount,
    });

    return NextResponse.json({
      success: true,
      result,
      message: `Batch generation processed: ${result.generated} generated, ${result.failed} failed.`,
    });
  } catch (error: any) {
    console.error("[GENERATE BATCH ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process certificate generation" },
      { status: 500 }
    );
  }
}
