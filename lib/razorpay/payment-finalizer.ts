import { getRazorpayClient } from "@/lib/razorpay/client";
import RegistrationModel, { IRegistrationDocument } from "@/models/Registration";
import EventModel from "@/models/Event";
import { getNextReceiptNumber } from "@/models/Counter";

export interface FinalizeResult {
  success: boolean;
  status: "paid" | "refunded";
  receiptToken?: string;
  receiptNumber?: string;
  refundId?: string;
  reason?: string;
}

/**
 * Shared payment finalization function used by:
 * 1. /api/payments/verify
 * 2. /api/webhooks/razorpay
 * 3. /api/admin/registrations/reconcile
 *
 * Rules:
 * - Verifies payment amount equals registration.amount and currency is INR.
 * - Idempotent: returns immediately if registration is already "paid".
 * - Allows transitions pending -> paid and failed -> paid (retry on same order).
 * - Never moves paid -> failed.
 * - Capacity/deadline checks are based on registration.createdAt (the seat hold), NOT payment time.
 * - Counts capacity excluding the registration being finalized.
 * - Only auto-refunds if seat hold (15 min) expired AND seats were taken by others,
 *   or event was cancelled/closed before registration was created.
 * - Catches duplicate-key errors on (eventId, email) by auto-refunding the extra payment
 *   and marking the registration "refunded".
 * - Every captured payment ends as "paid" or "refunded".
 */
export async function finalizePayment(
  registration: IRegistrationDocument,
  razorpayPayment: any
): Promise<FinalizeResult> {
  const razorpay = getRazorpayClient();
  const paymentId = razorpayPayment.id;
  const paymentAmount = Number(razorpayPayment.amount);
  const paymentCurrency = razorpayPayment.currency;

  // 1. Idempotency check: If already paid, return immediately
  if (registration.status === "paid") {
    return {
      success: true,
      status: "paid",
      receiptToken: registration.receiptToken,
      receiptNumber: registration.receiptNumber,
    };
  }

  // 2. Validate currency and amount
  if (paymentCurrency !== "INR" || paymentAmount !== registration.amount) {
    console.error(
      `[PAYMENT MISMATCH] Reg ${registration._id}: expected ${registration.amount} INR, received ${paymentAmount} ${paymentCurrency}`
    );
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        notes: {
          reason: `Amount or currency mismatch: expected ${registration.amount} INR, got ${paymentAmount} ${paymentCurrency}`,
          registrationId: registration._id.toString(),
        },
      });

      registration.status = "refunded";
      registration.razorpayPaymentId = paymentId;
      registration.refundId = refund.id;
      registration.refundedAt = new Date();
      await registration.save();

      return {
        success: false,
        status: "refunded",
        refundId: refund.id,
        reason: "Amount or currency mismatch. Automatic refund issued.",
      };
    } catch (refundErr) {
      console.error("[REFUND FAILED - MISMATCH]", refundErr);
      throw refundErr;
    }
  }

  // 3. Fetch Event for seat hold & deadline verification
  const event = await EventModel.findById(registration.eventId);
  if (!event) {
    // Event was deleted - auto-refund
    const refund = await razorpay.payments.refund(paymentId, {
      notes: { reason: "Event no longer exists" },
    });
    registration.status = "refunded";
    registration.razorpayPaymentId = paymentId;
    registration.refundId = refund.id;
    registration.refundedAt = new Date();
    await registration.save();
    return {
      success: false,
      status: "refunded",
      refundId: refund.id,
      reason: "Event does not exist. Payment refunded.",
    };
  }

  // Check if event was cancelled or registration closed BEFORE the registration was created
  if (
    event.statusOverride === "Cancelled" &&
    event.updatedAt &&
    new Date(event.updatedAt).getTime() < new Date(registration.createdAt).getTime()
  ) {
    const refund = await razorpay.payments.refund(paymentId, {
      notes: { reason: "Event cancelled prior to registration hold" },
    });
    registration.status = "refunded";
    registration.razorpayPaymentId = paymentId;
    registration.refundId = refund.id;
    registration.refundedAt = new Date();
    await registration.save();
    return {
      success: false,
      status: "refunded",
      refundId: refund.id,
      reason: "Event was cancelled before registration. Payment refunded.",
    };
  }

  // Capacity check based on createdAt hold:
  // Count paid registrations excluding this registration
  if (event.capacity && event.capacity > 0) {
    const otherPaidCount = await RegistrationModel.countDocuments({
      eventId: event._id,
      status: "paid",
      _id: { $ne: registration._id },
    });

    const holdExpired =
      Date.now() - new Date(registration.createdAt).getTime() > 15 * 60 * 1000;

    if (otherPaidCount >= event.capacity && holdExpired) {
      console.warn(
        `[SEAT HOLD EXPIRED & FULL] Registration ${registration._id} hold expired and capacity reached (${otherPaidCount}/${event.capacity}). Auto-refunding payment ${paymentId}.`
      );
      const refund = await razorpay.payments.refund(paymentId, {
        notes: {
          reason: "Seat hold expired and event capacity was filled by other participants",
        },
      });
      registration.status = "refunded";
      registration.razorpayPaymentId = paymentId;
      registration.refundId = refund.id;
      registration.refundedAt = new Date();
      await registration.save();
      return {
        success: false,
        status: "refunded",
        refundId: refund.id,
        reason: "Seat hold expired and capacity is full. Payment has been refunded.",
      };
    }
  }

  // 4. Assign atomic receipt number and update registration to "paid"
  try {
    let receiptNumber = registration.receiptNumber;
    if (!receiptNumber) {
      receiptNumber = await getNextReceiptNumber();
    }

    const updated = await RegistrationModel.findOneAndUpdate(
      {
        _id: registration._id,
        status: { $in: ["pending", "failed"] }, // allow pending -> paid and failed -> paid
      },
      {
        $set: {
          status: "paid",
          razorpayPaymentId: paymentId,
          paidAt: new Date(),
          receiptNumber,
          paymentMethod: razorpayPayment.method || "online",
        },
      },
      { new: true, runValidators: true }
    );

    if (updated) {
      return {
        success: true,
        status: "paid",
        receiptToken: updated.receiptToken,
        receiptNumber: updated.receiptNumber,
      };
    }

    // If update returned null, check if it was already marked paid concurrently
    const refreshed = await RegistrationModel.findById(registration._id);
    if (refreshed && refreshed.status === "paid") {
      return {
        success: true,
        status: "paid",
        receiptToken: refreshed.receiptToken,
        receiptNumber: refreshed.receiptNumber,
      };
    }

    throw new Error(
      `Could not update registration ${registration._id} to paid (current status: ${refreshed?.status})`
    );
  } catch (error: any) {
    // 5. Catch duplicate-key errors on (eventId, email) unique partial index
    if (error.code === 11000) {
      console.warn(
        `[DUPLICATE PAID REGISTRATION] Auto-refunding payment ${paymentId} for event ${registration.eventId}, email ${registration.email}`
      );
      try {
        const refund = await razorpay.payments.refund(paymentId, {
          notes: {
            reason: "Duplicate paid registration for the same participant and event",
          },
        });

        registration.status = "refunded";
        registration.razorpayPaymentId = paymentId;
        registration.refundId = refund.id;
        registration.refundedAt = new Date();
        await registration.save();

        return {
          success: false,
          status: "refunded",
          refundId: refund.id,
          reason:
            "A paid registration already exists with this email address for this event. Your duplicate payment has been automatically refunded.",
        };
      } catch (refundErr) {
        console.error("[AUTO-REFUND FAILED ON DUPLICATE]", refundErr);
        throw refundErr;
      }
    }

    console.error("[FINALIZE PAYMENT ERROR]", error);
    throw error;
  }
}
