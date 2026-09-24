import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb/client";
import EventModel from "@/models/Event";
import RegistrationModel from "@/models/Registration";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";
import {
  getEventStatus,
  resolveRegistrationMode,
  isDevelopmentPlaceholder,
} from "@/lib/utils/event-status";
import { PLACEHOLDER_EVENTS } from "@/lib/data/placeholders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpiRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  college: z.string().trim().min(2, "College name is required").max(150),
  department: z.string().trim().min(1, "Department is required").max(100),
  year: z.string().trim().min(1, "Year of study is required").max(50),
  installmentPlan: z.enum(["full", "installment"]).default("full"),
  upiTransactionRef: z.string().trim().min(4, "Transaction reference or UTR is required").max(100),
  upiProofUrl: z.string().min(1, "Payment proof screenshot is required"),
  // Client-supplied amount intentionally ignored — server recalculates from EventModel
});

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`upi-reg:${clientIp}`, 8, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many submission attempts. Please wait ${rateLimit.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const parsed = UpiRegisterSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }
    const {
      name,
      email,
      phone,
      college,
      department,
      year,
      installmentPlan,
      upiTransactionRef,
      upiProofUrl,
    } = parsed.data;

    // 3. Find event by MongoDB _id or slug
    const eventIdentifier = params.id;
    let event: any = null;
    const conn = await connectToDatabase();
    if (conn) {
      if (/^[0-9a-fA-F]{24}$/.test(eventIdentifier)) {
        event = await EventModel.findById(eventIdentifier);
      }
      if (!event) {
        event = await EventModel.findOne({ slug: eventIdentifier });
      }
    }
    if (!event && process.env.NODE_ENV !== "production") {
      event =
        (PLACEHOLDER_EVENTS.find(
          (e) => e.id === eventIdentifier || e.slug === eventIdentifier
        ) as any) || null;
    }
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    // 4. Server-side validations
    if (!event.published) {
      return NextResponse.json(
        { success: false, error: "Registration is not available for this event." },
        { status: 400 }
      );
    }
    if (isDevelopmentPlaceholder(event)) {
      return NextResponse.json(
        { success: false, error: "Registrations are disabled for development placeholder events." },
        { status: 400 }
      );
    }
    const regMode = resolveRegistrationMode(event);
    if (regMode !== "onsite") {
      return NextResponse.json(
        { success: false, error: "This event does not accept on-site UPI registrations." },
        { status: 400 }
      );
    }
    if (event.paymentMode !== "manual_upi") {
      return NextResponse.json(
        { success: false, error: "This event is not configured for manual UPI payment." },
        { status: 400 }
      );
    }
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database temporarily unavailable." },
        { status: 503 }
      );
    }

    // 5. Check capacity (treat verification_required like seat hold)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const [paidCount, recentHoldCount] = await Promise.all([
      RegistrationModel.countDocuments({ eventId: event._id, status: "paid" }),
      RegistrationModel.countDocuments({
        eventId: event._id,
        status: { $in: ["pending", "verification_required"] },
        createdAt: { $gte: fifteenMinutesAgo },
      }),
    ]);
    const totalReserved = paidCount + recentHoldCount;
    const eventStatus = getEventStatus(event, totalReserved, new Date());
    if (eventStatus.registration === "sold-out") {
      return NextResponse.json(
        { success: false, error: "All seats are currently booked or reserved." },
        { status: 409 }
      );
    }
    if (eventStatus.registration !== "open") {
      return NextResponse.json(
        { success: false, error: "Registration for this event is currently closed." },
        { status: 400 }
      );
    }

    // 6. Duplicate check: prevent duplicate paid registration per event+email
    const existingPaid = await RegistrationModel.findOne({
      eventId: event._id,
      email,
      status: "paid",
    });
    if (existingPaid) {
      return NextResponse.json(
        {
          success: false,
          error: "A paid registration already exists with this email for this event.",
        },
        { status: 409 }
      );
    }

    // 7. Prevent duplicate UTR / transaction reference submissions
    const existingUpiRef = await RegistrationModel.findOne({
      eventId: event._id,
      $or: [
        { upiTransactionRef },
        { part2TransactionRef: upiTransactionRef },
      ],
      status: { $in: ["pending", "verification_required", "paid"] },
    });
    if (existingUpiRef) {
      return NextResponse.json(
        {
          success: false,
          error: "This UPI transaction reference has already been submitted for this event.",
        },
        { status: 409 }
      );
    }

    // 8. Compute amount server-side from EventModel (never trust client amount)
    const feeRupees = event.fee !== undefined && event.fee >= 0 ? Math.floor(event.fee) : 0;
    const totalAmountPaise = feeRupees * 100;
    let amountDueNowPaise = totalAmountPaise;
    let chosenPlan: "full" | "installment" = "full";
    let installmentStatusValue: string | null = null;

    if (installmentPlan === "installment" && event.installmentEnabled) {
      chosenPlan = "installment";
      const part1Rupees =
        event.installmentPart1Amount !== null && event.installmentPart1Amount !== undefined
          ? Math.floor(event.installmentPart1Amount)
          : Math.ceil(feeRupees * 0.5);
      amountDueNowPaise = part1Rupees * 100;
      installmentStatusValue = "part1_pending";
    }

    const receiptToken = crypto.randomBytes(24).toString("hex");

    // 9. Create registration — snapshot UPI config at submission time
    const registration = await RegistrationModel.create({
      eventId: event._id,
      name,
      email,
      phone,
      college,
      department,
      year,
      status: "verification_required",
      amount: amountDueNowPaise,
      totalAmount: totalAmountPaise,
      receiptToken,
      paymentMethod: "MANUAL_UPI",
      paymentMode: "manual_upi",
      upiProofUrl,
      upiTransactionRef,
      upiId: event.upiId || null,
      upiQrUrl: event.upiQrUrl || null,
      installmentPlan: chosenPlan,
      installmentStatus: installmentStatusValue,
    });

    return NextResponse.json({
      success: true,
      message:
        chosenPlan === "installment"
          ? "Installment Part 1 payment proof submitted. Administrator will verify within 24 hours."
          : "Payment proof submitted. Administrator will verify within 24 hours.",
      receiptToken: registration.receiptToken,
      registrationId: registration._id.toString(),
    });
  } catch (error: any) {
    console.error("[UPI REGISTER ROUTE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit UPI registration." },
      { status: 500 }
    );
  }
}
