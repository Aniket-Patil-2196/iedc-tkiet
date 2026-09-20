import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb/client";
import EventModel from "@/models/Event";
import RegistrationModel from "@/models/Registration";
import { getNextReceiptNumber } from "@/models/Counter";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";
import {
  getEventStatus,
  resolveRegistrationMode,
  isDevelopmentPlaceholder,
  isPaymentsEnabled,
} from "@/lib/utils/event-status";

import { PLACEHOLDER_EVENTS } from "@/lib/data/placeholders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid 10-digit phone number")
    .max(15)
    .regex(/^[0-9+\s()-]+$/, "Invalid phone number format"),
  college: z.string().trim().min(2, "College name must be at least 2 characters").max(150),
  year: z.string().trim().min(1, "Year of study is required").max(50),
});

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    // 1. Rate Limiting: 10 registrations per minute per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`reg:${clientIp}`, 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many registration attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const validationResult = RegisterSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError =
        validationResult.error.issues[0]?.message ||
        validationResult.error.message ||
        "Invalid input";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }
    const { name, email, phone, college, year } = validationResult.data;

    // 3. Find Event by MongoDB ID or slug (or placeholder)
    const eventIdentifier = params.id;
    let event = null;
    const conn = await connectToDatabase();
    if (conn) {
      if (eventIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
        event = await EventModel.findById(eventIdentifier);
      }
      if (!event) {
        event = await EventModel.findOne({ slug: eventIdentifier });
      }
    }
    if (!event && process.env.NODE_ENV !== "production") {
      event = (PLACEHOLDER_EVENTS.find(
        (e) => e.id === eventIdentifier || e.slug === eventIdentifier
      ) as any) || null;
    }

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    // 4. Server-side validations: Published, Not Placeholder, Mode is "onsite"
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
        {
          success: false,
          error:
            regMode === "external"
              ? "This event accepts registrations via an external portal only."
              : "This event does not require online registration.",
        },
        { status: 400 }
      );
    }

    // 5. Check if online registration and payments are enabled
    if (!isPaymentsEnabled()) {
      return NextResponse.json(
        { success: false, error: "Online registration is not currently enabled." },
        { status: 403 }
      );
    }

    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database service unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    // 6. Check Capacity & Shared Event Status (paid count + active 15m holds)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const [paidCount, recentPendingCount] = await Promise.all([
      RegistrationModel.countDocuments({ eventId: event._id, status: "paid" }),
      RegistrationModel.countDocuments({
        eventId: event._id,
        status: "pending",
        createdAt: { $gte: fifteenMinutesAgo },
      }),
    ]);
    const totalReserved = paidCount + recentPendingCount;

    const eventStatus = getEventStatus(event, totalReserved, new Date());

    if (eventStatus.registration === "sold-out") {
      return NextResponse.json(
        {
          success: false,
          error:
            "All seats are currently booked or reserved. If pending checkouts expire, seats may open up soon.",
        },
        { status: 409 }
      );
    }

    if (eventStatus.registration !== "open") {
      return NextResponse.json(
        { success: false, error: "Registration for this event is currently closed." },
        { status: 400 }
      );
    }

    // 7. Check if email already registered with PAID status for this event
    const existingPaid = await RegistrationModel.findOne({
      eventId: event._id,
      email,
      status: "paid",
    });
    if (existingPaid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A paid registration already exists with this email for this event. You can look up your receipt using 'Find My Receipt'.",
        },
        { status: 409 }
      );
    }

    // 8. Determine Fee (always read from DB, never trust client)
    const feeRupees = event.fee !== undefined && event.fee >= 0 ? Math.floor(event.fee) : 0;
    const receiptToken = crypto.randomBytes(24).toString("hex");

    // 9. Free Event Flow (fee = 0)
    if (feeRupees === 0) {
      const receiptNumber = await getNextReceiptNumber();
      const registration = await RegistrationModel.create({
        eventId: event._id,
        name,
        email,
        phone,
        college,
        year,
        status: "paid",
        amount: 0,
        paidAt: new Date(),
        receiptNumber,
        receiptToken,
        paymentMethod: "free",
      });

      return NextResponse.json({
        success: true,
        isFree: true,
        receiptToken: registration.receiptToken,
        receiptNumber: registration.receiptNumber,
      });
    }

    // 10. Paid Event Flow (fee > 0): Create pending Registration & Razorpay Order
    const amountInPaise = feeRupees * 100;

    const registration = await RegistrationModel.create({
      eventId: event._id,
      name,
      email,
      phone,
      college,
      year,
      status: "pending",
      amount: amountInPaise,
      receiptToken,
    });

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: registration._id.toString(),
      notes: {
        eventId: event._id.toString(),
        registrationId: registration._id.toString(),
      },
    });

    registration.razorpayOrderId = order.id;
    await registration.save();

    return NextResponse.json({
      success: true,
      isFree: false,
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: amountInPaise,
      receiptToken: registration.receiptToken,
    });
  } catch (error: any) {
    console.error("[EVENT REGISTRATION ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during registration.",
      },
      { status: 500 }
    );
  }
}
