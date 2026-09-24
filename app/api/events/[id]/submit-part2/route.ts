import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb/client";
import RegistrationModel from "@/models/Registration";
import EventModel from "@/models/Event";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Part2Schema = z
  .object({
    regId: z.string().min(1, "Registration ID is required"),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/)
      .optional(),
    upiTransactionRef: z
      .string()
      .trim()
      .min(4, "Transaction reference or UTR is required")
      .max(100),
    upiProofUrl: z.string().min(1, "Payment proof screenshot is required"),
    // Client-supplied remaining/amount intentionally ignored
  })
  .refine((d) => Boolean(d.email || d.phone), {
    message: "Email or phone is required to verify ownership of this registration.",
  });

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`part2:${clientIp}`, 6, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many submission attempts. Please wait." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = Part2Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { regId, email, phone, upiTransactionRef, upiProofUrl } = parsed.data;

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database temporarily unavailable." },
        { status: 503 }
      );
    }

    // Lookup via regId + email/phone — never regId alone
    const ownershipFilter: Record<string, unknown> = { _id: regId };
    if (email && phone) {
      ownershipFilter.$or = [{ email }, { phone }];
    } else if (email) {
      ownershipFilter.email = email;
    } else {
      ownershipFilter.phone = phone;
    }

    const registration = await RegistrationModel.findOne(ownershipFilter);
    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration not found, or email/phone does not match this registration.",
        },
        { status: 404 }
      );
    }

    // Ensure registration belongs to the event in the URL (id or slug)
    const eventIdentifier = params.id;
    const event = /^[0-9a-fA-F]{24}$/.test(eventIdentifier)
      ? await EventModel.findById(eventIdentifier)
      : await EventModel.findOne({ slug: eventIdentifier });

    if (!event || registration.eventId.toString() !== event._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Registration does not belong to this event." },
        { status: 400 }
      );
    }

    if (registration.paymentMethod !== "MANUAL_UPI" && registration.paymentMode !== "manual_upi") {
      return NextResponse.json(
        { success: false, error: "This registration is not a manual UPI registration." },
        { status: 400 }
      );
    }

    if (registration.status === "paid" || registration.installmentStatus === "complete") {
      return NextResponse.json(
        { success: false, error: "This registration is already fully paid." },
        { status: 400 }
      );
    }

    if (
      registration.installmentPlan !== "installment" ||
      registration.installmentStatus !== "part1_paid"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            registration.installmentStatus === "part2_pending"
              ? "Part 2 payment proof is already submitted and pending admin review."
              : "Part 1 payment must be approved before Part 2 can be submitted.",
        },
        { status: 400 }
      );
    }

    // Server-compute remaining amount from snapshotted total (fallback to live event fee)
    const totalPaise =
      registration.totalAmount != null && registration.totalAmount > 0
        ? registration.totalAmount
        : Math.floor(event.fee || 0) * 100;
    const paidSoFarPaise = registration.amount || 0;
    const remainingPaise = totalPaise - paidSoFarPaise;

    if (remainingPaise <= 0) {
      return NextResponse.json(
        { success: false, error: "No remaining balance — registration appears fully paid." },
        { status: 400 }
      );
    }

    // Expected part2 from event config (informational consistency check vs snapshot remainder)
    if (event.installmentEnabled && event.installmentPart2Amount != null) {
      const expectedPart2Paise = Math.floor(event.installmentPart2Amount) * 100;
      // Prefer snapshotted remainder; only reject if config clearly conflicts with zero-remaining case
      if (expectedPart2Paise <= 0 && remainingPaise > 0) {
        return NextResponse.json(
          { success: false, error: "Installment Part 2 amount is misconfigured for this event." },
          { status: 400 }
        );
      }
    }

    // Duplicate UTR detection (part1 or part2 slots)
    const duplicateUtr = await RegistrationModel.findOne({
      eventId: registration.eventId,
      _id: { $ne: registration._id },
      $or: [
        { upiTransactionRef },
        { part2TransactionRef: upiTransactionRef },
      ],
      status: { $in: ["pending", "verification_required", "paid"] },
    });
    if (duplicateUtr || registration.upiTransactionRef === upiTransactionRef) {
      return NextResponse.json(
        {
          success: false,
          error: "This UPI transaction reference has already been used.",
        },
        { status: 409 }
      );
    }

    registration.part2TransactionRef = upiTransactionRef;
    registration.part2ProofUrl = upiProofUrl;
    registration.installmentStatus = "part2_pending";
    registration.status = "verification_required";
    await registration.save();

    return NextResponse.json({
      success: true,
      message: "Installment Part 2 proof submitted successfully. Administrator will verify.",
      remainingAmountPaise: remainingPaise,
    });
  } catch (error: any) {
    console.error("[PART2 SUBMISSION ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit Part 2 proof." },
      { status: 500 }
    );
  }
}
