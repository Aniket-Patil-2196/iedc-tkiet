import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb/client";
import RegistrationModel from "@/models/Registration";
import EventModel from "@/models/Event";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LookupSchema = z
  .object({
    regId: z.string().min(1, "Registration ID is required"),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/)
      .optional(),
  })
  .refine((d) => Boolean(d.email || d.phone), {
    message: "Email or phone is required.",
  });

/**
 * Lookup an installment registration eligible for Part 2 payment.
 * Returns remaining amount computed server-side (never trusts client).
 */
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`part2-lookup:${clientIp}`, 8, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many lookup attempts. Please wait." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = LookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { regId, email, phone } = parsed.data;

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database temporarily unavailable." },
        { status: 503 }
      );
    }

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
          error: "Registration not found, or email/phone does not match.",
        },
        { status: 404 }
      );
    }

    if (registration.paymentMethod !== "MANUAL_UPI" && registration.paymentMode !== "manual_upi") {
      return NextResponse.json(
        { success: false, error: "This registration is not a manual UPI installment." },
        { status: 400 }
      );
    }

    if (registration.status === "paid" || registration.installmentStatus === "complete") {
      return NextResponse.json(
        {
          success: false,
          error: "This registration is already fully paid.",
          redirectUrl: `/receipt/${registration.receiptToken}`,
        },
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
              ? "Part 2 proof is already submitted and awaiting admin review."
              : registration.installmentStatus === "part1_pending"
              ? "Part 1 is still awaiting admin verification."
              : "This registration is not eligible for Part 2 payment yet.",
          redirectUrl: `/receipt/${registration.receiptToken}`,
        },
        { status: 400 }
      );
    }

    const event = await EventModel.findById(registration.eventId).lean();
    const totalPaise =
      registration.totalAmount != null && registration.totalAmount > 0
        ? registration.totalAmount
        : Math.floor((event as any)?.fee || 0) * 100;
    const paidPaise = registration.amount || 0;
    const remainingPaise = Math.max(0, totalPaise - paidPaise);

    if (remainingPaise <= 0) {
      return NextResponse.json(
        { success: false, error: "No remaining balance on this registration." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        regId: registration._id.toString(),
        eventId: registration.eventId.toString(),
        eventTitle: (event as any)?.title || "Event",
        eventSlug: (event as any)?.slug || "",
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        amountPaidPaise: paidPaise,
        totalAmountPaise: totalPaise,
        remainingAmountPaise: remainingPaise,
        upiId: registration.upiId || (event as any)?.upiId || null,
        upiQrUrl: registration.upiQrUrl || (event as any)?.upiQrUrl || null,
        receiptToken: registration.receiptToken,
        installmentStatus: registration.installmentStatus,
      },
    });
  } catch (error: any) {
    console.error("[PART2 LOOKUP ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lookup failed." },
      { status: 500 }
    );
  }
}
