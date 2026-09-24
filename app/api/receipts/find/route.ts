import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb/client";
import RegistrationModel from "@/models/Registration";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FindReceiptSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().optional(),
  receiptNumber: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Strict rate limiting: 5 requests per minute per IP to prevent enumeration
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`find_receipt:${clientIp}`, 5, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many lookup attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const parsed = FindReceiptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email and phone number or receipt number." },
        { status: 400 }
      );
    }

    const { email, phone, receiptNumber } = parsed.data;

    if (!phone && !receiptNumber) {
      return NextResponse.json(
        { success: false, error: "Please provide either your phone number or your receipt number." },
        { status: 400 }
      );
    }

    // 3. Connect to DB
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // 4. Match fully-paid OR in-progress UPI / installment registrations
    //    (part1_paid lives under status verification_required — must be findable)
    const query: any = {
      email,
      $or: [
        { status: "paid" },
        { status: "verification_required" },
        { status: "pending", paymentMethod: "MANUAL_UPI" },
        { status: "pending", paymentMode: "manual_upi" },
      ],
    };

    if (receiptNumber) {
      query.receiptNumber = receiptNumber.toUpperCase();
    } else if (phone) {
      const digitsOnly = phone.replace(/\D/g, "");
      const phoneRegex = new RegExp(digitsOnly.slice(-10) + "$");
      query.phone = { $regex: phoneRegex };
    }

    const registration = await RegistrationModel.findOne(
      query,
      "receiptToken receiptNumber createdAt status installmentStatus"
    ).sort({ createdAt: -1 });

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No matching registration found for the provided details. Please verify your information or contact support.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectUrl: `/receipt/${registration.receiptToken}`,
      status: registration.status,
      installmentStatus: registration.installmentStatus,
    });
  } catch (error: any) {
    console.error("[FIND RECEIPT ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to process receipt lookup." },
      { status: 500 }
    );
  }
}
