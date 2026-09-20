import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb/client";
import RegistrationModel from "@/models/Registration";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { finalizePayment } from "@/lib/razorpay/payment-finalizer";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VerifySchema = z.object({
  order_id: z.string().min(1, "order_id is required"),
  payment_id: z.string().min(1, "payment_id is required"),
  signature: z.string().min(1, "signature is required"),
  receiptToken: z.string().min(1, "receiptToken is required"),
});

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: 20 verify attempts per minute per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`verify:${clientIp}`, 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification requests. Please wait ${rateLimit.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            parsed.error.issues[0]?.message ||
            parsed.error.message ||
            "Invalid payload",
        },
        { status: 400 }
      );
    }
    const { order_id, payment_id, signature, receiptToken } = parsed.data;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("[VERIFY ERROR] RAZORPAY_KEY_SECRET not set in environment.");
      return NextResponse.json(
        { success: false, error: "Server payment configuration error." },
        { status: 500 }
      );
    }

    // 3. Compute HMAC SHA256 of `${order_id}|${payment_id}`
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const signatureBuffer = Buffer.from(signature, "utf-8");

    // Timing-safe comparison (must verify byte lengths match first to prevent throw)
    const isValidSignature =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isValidSignature) {
      console.warn(`[VERIFY FAILED] Invalid signature for order ${order_id}, payment ${payment_id}`);
      return NextResponse.json(
        { success: false, error: "Payment verification failed: invalid signature." },
        { status: 400 }
      );
    }

    // 4. Connect to database
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database temporarily unavailable." },
        { status: 503 }
      );
    }

    // 5. Look up registration
    const registration = await RegistrationModel.findOne({
      $or: [{ razorpayOrderId: order_id }, { receiptToken }],
    });

    if (!registration) {
      console.error(`[VERIFY ERROR] Registration not found for order ${order_id} or token ${receiptToken}`);
      return NextResponse.json(
        { success: false, error: "Registration record not found for this transaction." },
        { status: 404 }
      );
    }

    // 6. Fetch payment from Razorpay
    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(payment_id);

    // 7. Finalize payment using shared function
    const result = await finalizePayment(registration, payment);

    return NextResponse.json({
      success: result.success,
      status: result.status,
      receiptToken: result.receiptToken || registration.receiptToken,
      receiptNumber: result.receiptNumber || registration.receiptNumber,
      refundId: result.refundId,
      reason: result.reason,
    });
  } catch (error: any) {
    console.error("[PAYMENT VERIFY ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to verify payment.",
      },
      { status: 500 }
    );
  }
}
