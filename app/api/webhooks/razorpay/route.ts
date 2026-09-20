import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb/client";
import RegistrationModel from "@/models/Registration";
import { finalizePayment } from "@/lib/razorpay/payment-finalizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let eventId = "unknown";
  let paymentId = "unknown";

  try {
    // 1. Read raw body as text for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.warn("[WEBHOOK ERROR] Missing x-razorpay-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[WEBHOOK ERROR] RAZORPAY_WEBHOOK_SECRET not defined in environment");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 2. Verify HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const signatureBuffer = Buffer.from(signature, "utf-8");

    const isValid =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isValid) {
      console.warn("[WEBHOOK ERROR] Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 3. Parse JSON event payload
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    eventId = event.id || "unknown";

    // 4. Connect to database - return 500 on transient connection error so Razorpay retries
    const conn = await connectToDatabase();
    if (!conn) {
      console.error(`[WEBHOOK TRANSIENT ERROR] DB unavailable for event ${eventId}`);
      return NextResponse.json(
        { error: "Database connection unavailable. Please retry." },
        { status: 500 }
      );
    }

    // 5. Handle supported events
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;

      paymentId = payment?.id || "unknown";
      const orderId = payment?.order_id || order?.id;
      const notes = payment?.notes || order?.notes || {};
      const registrationId = notes.registrationId || notes.registration_id;

      console.log(
        `[WEBHOOK EVENT ${eventId}] Type: ${eventType}, PaymentId: ${paymentId}, OrderId: ${orderId}`
      );

      // Find registration by orderId, registrationId, or paymentId
      const query: any = {
        $or: [
          ...(orderId ? [{ razorpayOrderId: orderId }] : []),
          ...(registrationId ? [{ _id: registrationId }] : []),
          ...(paymentId && paymentId !== "unknown" ? [{ razorpayPaymentId: paymentId }] : []),
        ],
      };

      const registration = await RegistrationModel.findOne(query);

      if (!registration) {
        console.warn(
          `[WEBHOOK NOTICE] Registration not found for event ${eventId}, order ${orderId}, payment ${paymentId}. Event safely acknowledged.`
        );
        return NextResponse.json({ status: "acknowledged", reason: "registration_not_found" });
      }

      // Finalize payment idempotently (handles capacity, duplicate detection, and refunds)
      const result = await finalizePayment(registration, payment);
      console.log(
        `[WEBHOOK PROCESSED] Event ${eventId}, Payment ${paymentId}, Result Status: ${result.status}`
      );

      return NextResponse.json({ status: "ok", resultStatus: result.status });
    }

    if (eventType === "payment.failed") {
      const payment = event.payload?.payment?.entity;
      paymentId = payment?.id || "unknown";
      const orderId = payment?.order_id;
      const notes = payment?.notes || {};
      const registrationId = notes.registrationId || notes.registration_id;

      console.log(
        `[WEBHOOK PAYMENT FAILED ${eventId}] PaymentId: ${paymentId}, OrderId: ${orderId}`
      );

      const query: any = {
        $or: [
          ...(orderId ? [{ razorpayOrderId: orderId }] : []),
          ...(registrationId ? [{ _id: registrationId }] : []),
        ],
      };

      const registration = await RegistrationModel.findOne(query);
      if (registration) {
        // Only move pending -> failed. NEVER move paid -> failed!
        if (registration.status === "pending") {
          registration.status = "failed";
          registration.razorpayPaymentId = paymentId;
          await registration.save();
          console.log(
            `[WEBHOOK REGISTRATION FAILED] Registration ${registration._id} marked as failed from pending.`
          );
        } else if (registration.status === "paid") {
          console.warn(
            `[WEBHOOK IGNORE FAILED] Registration ${registration._id} is already paid. Ignoring payment.failed event.`
          );
        }
      }

      return NextResponse.json({ status: "ok", processed: "payment_failed" });
    }

    // Irrelevant event type - return 200 OK
    return NextResponse.json({ status: "ok", ignoredEvent: eventType });
  } catch (error: any) {
    console.error(
      `[WEBHOOK UNCAUGHT ERROR] Event: ${eventId}, Payment: ${paymentId}`,
      error
    );
    // Return 500 so Razorpay retries the webhook delivery
    return NextResponse.json(
      { error: "Webhook internal failure. Will trigger retry." },
      { status: 500 }
    );
  }
}
