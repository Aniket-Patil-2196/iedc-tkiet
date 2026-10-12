import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateRecipientModel from "@/models/CertificateRecipient";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ success: false, error: "Invalid batch ID" }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim();
    const generationStatus = searchParams.get("generationStatus")?.trim();
    const emailStatus = searchParams.get("emailStatus")?.trim();

    const query: any = { batchId: new mongoose.Types.ObjectId(params.id) };

    if (search) {
      query.$or = [
        { participantName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { certificateId: { $regex: search, $options: "i" } },
      ];
    }

    if (generationStatus && generationStatus !== "all") {
      query.generationStatus = generationStatus;
    }

    if (emailStatus && emailStatus !== "all") {
      query.emailStatus = emailStatus;
    }

    const skip = (page - 1) * limit;

    const [recipients, totalRecipients] = await Promise.all([
      CertificateRecipientModel.find(query)
        .sort({ sourceRowNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CertificateRecipientModel.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      recipients,
      pagination: {
        page,
        limit,
        totalRecipients,
        totalPages: Math.ceil(totalRecipients / limit),
      },
    });
  } catch (error: any) {
    console.error("[GET RECIPIENTS ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch recipients" },
      { status: 500 }
    );
  }
}
