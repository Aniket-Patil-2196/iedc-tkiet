import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { processBatchEmailDistribution } from "@/lib/certificates/batch-processor";
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
    const retryFailedOnly = body.retryFailedOnly === true;
    const forceResend = body.forceResend === true;
    const maxCount = body.maxCount ? parseInt(body.maxCount, 10) : undefined;

    const result = await processBatchEmailDistribution(params.id, {
      retryFailedOnly,
      forceResend,
      maxCount,
    });

    return NextResponse.json({
      success: true,
      result,
      message: `Email distribution processed: ${result.sent} sent, ${result.failed} failed, ${result.pending} pending.`,
    });
  } catch (error: any) {
    console.error("[SEND EMAILS ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process email delivery" },
      { status: 500 }
    );
  }
}
