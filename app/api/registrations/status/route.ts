import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import RegistrationModel from "@/models/Registration";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || typeof token !== "string" || token.length < 16) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`status:${clientIp}`, 60, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many status check requests" },
        { status: 429 }
      );
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const registration = await RegistrationModel.findOne(
      { receiptToken: token },
      "status receiptToken receiptNumber paidAt amount"
    );

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: registration.status,
      receiptToken: registration.receiptToken,
      receiptNumber: registration.receiptNumber,
      paidAt: registration.paidAt,
    });
  } catch (error: any) {
    console.error("[REGISTRATION STATUS GET ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
