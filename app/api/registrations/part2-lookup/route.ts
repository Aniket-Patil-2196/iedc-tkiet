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
    email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
    phone: z.string().trim().optional().or(z.literal("")),
  })
  .transform((d) => {
    const email = d.email && d.email.length > 0 ? d.email : undefined;
    const phoneRaw = d.phone && d.phone.length > 0 ? d.phone : undefined;
    const phoneDigits = phoneRaw ? phoneRaw.replace(/\D/g, "") : undefined;
    const phone =
      phoneDigits && phoneDigits.length >= 10
        ? phoneDigits.slice(-10)
        : phoneDigits && phoneDigits.length > 0
        ? phoneDigits
        : undefined;
    return { email, phone };
  })
  .superRefine((d, ctx) => {
    if (!d.email && !d.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide the email or phone number used during registration.",
      });
    }
    if (d.phone && !/^[6-9]\d{9}$/.test(d.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid 10-digit Indian mobile number.",
      });
    }
  });

const GENERIC_NOT_FOUND =
  "No matching installment registration found. Please check the email or phone you used during registration.";
const GENERIC_MISMATCH =
  "The email and phone do not match the same registration. Please use the details from your original registration.";
const GENERIC_AMBIGUOUS =
  "Multiple registrations matched. Please enter both the email and phone number used during registration.";

function remainingPaiseFor(registration: {
  totalAmount?: number | null;
  amount?: number | null;
}, eventFee?: number | null) {
  const totalPaise =
    registration.totalAmount != null && registration.totalAmount > 0
      ? registration.totalAmount
      : Math.floor(eventFee || 0) * 100;
  const paidPaise = registration.amount || 0;
  return {
    totalPaise,
    paidPaise,
    remainingPaise: Math.max(0, totalPaise - paidPaise),
  };
}

function isManualUpi(registration: {
  paymentMethod?: string | null;
  paymentMode?: string | null;
}) {
  return (
    registration.paymentMethod === "MANUAL_UPI" ||
    registration.paymentMode === "manual_upi"
  );
}

/**
 * Lookup an installment registration eligible for Part 2 payment.
 * Identity: email and/or phone only (no Registration ID).
 * Remaining amount is always computed server-side.
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

    const { email, phone } = parsed.data;

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database temporarily unavailable." },
        { status: 503 }
      );
    }

    // Phone stored as 10-digit string; tolerate formatting with end-anchored regex
    const phoneFilter = phone
      ? { phone: { $regex: new RegExp(`${phone}$`) } }
      : null;

    let candidates: any[] = [];

    if (email && phone) {
      // Both provided → must belong to the SAME registration (AND)
      candidates = await RegistrationModel.find({
        email,
        ...phoneFilter!,
      }).sort({ updatedAt: -1, createdAt: -1 });

      if (candidates.length === 0) {
        // Detect cross-registration mismatch without leaking which field matched
        const [byEmail, byPhone] = await Promise.all([
          RegistrationModel.findOne({ email }).select("_id").lean(),
          RegistrationModel.findOne(phoneFilter!).select("_id").lean(),
        ]);
        if (byEmail && byPhone && String(byEmail._id) !== String(byPhone._id)) {
          return NextResponse.json(
            { success: false, error: GENERIC_MISMATCH },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { success: false, error: GENERIC_NOT_FOUND },
          { status: 404 }
        );
      }
    } else if (email) {
      candidates = await RegistrationModel.find({ email }).sort({
        updatedAt: -1,
        createdAt: -1,
      });
    } else {
      candidates = await RegistrationModel.find(phoneFilter!).sort({
        updatedAt: -1,
        createdAt: -1,
      });
    }

    if (candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: GENERIC_NOT_FOUND },
        { status: 404 }
      );
    }

    // Single-field search: if matches span different people, require both fields
    if (!(email && phone) && candidates.length > 1) {
      const emails = new Set(
        candidates.map((c) => String(c.email || "").toLowerCase()).filter(Boolean)
      );
      const phones = new Set(
        candidates.map((c) => String(c.phone || "").replace(/\D/g, "").slice(-10))
      );
      if (emails.size > 1 || phones.size > 1) {
        return NextResponse.json(
          { success: false, error: GENERIC_AMBIGUOUS },
          { status: 400 }
        );
      }
    }

    const manualUpiCandidates = candidates.filter(isManualUpi);
    if (manualUpiCandidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No manual UPI installment registration found for these details.",
        },
        { status: 400 }
      );
    }

    // Prefer eligible Part-2 candidates; fall through to status-specific errors if none
    const eligible = manualUpiCandidates.filter(
      (r) =>
        r.installmentPlan === "installment" &&
        r.installmentStatus === "part1_paid" &&
        r.status !== "paid"
    );

    let registration = eligible[0] || null;

    if (!registration) {
      // Use most recent manual UPI match for precise, non-leaky status messaging
      const latest = manualUpiCandidates[0];
      if (latest.status === "paid" || latest.installmentStatus === "complete") {
        return NextResponse.json(
          {
            success: false,
            error: "This registration is already fully paid.",
            redirectUrl: `/receipt/${latest.receiptToken}`,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error:
            latest.installmentStatus === "part2_pending"
              ? "Part 2 proof is already submitted and awaiting admin review."
              : latest.installmentStatus === "part1_pending"
              ? "Part 1 is still awaiting admin verification."
              : latest.installmentPlan !== "installment"
              ? "This registration is not on an installment plan."
              : "This registration is not eligible for Part 2 payment yet.",
          redirectUrl: `/receipt/${latest.receiptToken}`,
        },
        { status: 400 }
      );
    }

    // Multiple eligible for same identity → pick most recent (already sorted)
    // Never return another student's data (ambiguous cross-identity already rejected above)

    const event = await EventModel.findById(registration.eventId).lean();
    const { totalPaise, paidPaise, remainingPaise } = remainingPaiseFor(
      registration,
      (event as any)?.fee
    );

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
        installmentPlan: registration.installmentPlan || "installment",
        installmentCount: 2,
        installmentPart: 2,
      },
    });
  } catch (error: any) {
    console.error("[PART2 LOOKUP ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Lookup failed. Please try again." },
      { status: 500 }
    );
  }
}
