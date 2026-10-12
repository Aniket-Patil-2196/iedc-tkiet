import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { processBatchEmailDistribution } from "@/lib/certificates/batch-processor";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: Params) {
  console.log(`[SEND EMAILS API START] Initiating email distribution for batch ${params.id}`);

  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      console.warn("[SEND EMAILS API 401] Unauthorized access attempt");
      return NextResponse.json(
        { success: false, error: "Unauthorized access. Session invalid or expired." },
        { status: 401 }
      );
    }

    if (!mongoose.isValidObjectId(params.id)) {
      console.warn(`[SEND EMAILS API 400] Invalid batch ID: ${params.id}`);
      return NextResponse.json(
        { success: false, error: "Invalid batch ID format." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const retryFailedOnly = body.retryFailedOnly === true;
    const forceResend = body.forceResend === true;
    // Process in small bounded batches of 5 at a time to prevent serverless timeouts
    const batchSize = Math.max(1, Math.min(10, parseInt(body.batchSize || body.maxCount || "5", 10)));

    console.log(`[SEND EMAILS API] Processing chunk with batchSize: ${batchSize}, retryFailedOnly: ${retryFailedOnly}`);

    const result = await processBatchEmailDistribution(params.id, {
      retryFailedOnly,
      forceResend,
      maxCount: batchSize,
    });

    console.log(
      `[SEND EMAILS API FINISH] Batch ${params.id} chunk finished: ` +
        `sent: ${result.sent}, failed: ${result.failed}, pending: ${result.pending}, ` +
        `processedThisRun: ${result.processedThisRun}, hasMore: ${result.hasMore}`
    );

    let message = `Chunk processed: ${result.processedThisRun} email(s) attempted. Current totals: ${result.sent} sent, ${result.pending} pending.`;
    if (result.lastError) {
      message += ` (Last notice: ${result.lastError})`;
    }

    return NextResponse.json({
      success: true,
      result,
      message,
      hasMore: result.hasMore,
    });
  } catch (error: any) {
    console.error("[SEND EMAILS API UNCAUGHT EXCEPTION]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error occurred during email delivery.",
      },
      { status: 500 }
    );
  }
}
