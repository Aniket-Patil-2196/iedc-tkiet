import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import LeadershipMessageModel from "@/models/LeadershipMessage";
import { PLACEHOLDER_LEADERSHIP_ROLES } from "@/lib/data/placeholders";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      const adapted = PLACEHOLDER_LEADERSHIP_ROLES.map((r) => ({
        _id: r.id,
        designation: r.positionTitle,
        leaderName: "Leadership Member [To Be Configured]",
        institution: r.institution,
        message: r.fullMessage,
        order: r.order,
      }));
      return NextResponse.json({
        success: true,
        data: adapted,
        source: "placeholder",
      });
    }

    const messages = await LeadershipMessageModel.find().sort({ order: 1 });
    return NextResponse.json({
      success: true,
      data: messages,
      source: "database",
    });
  } catch (error) {
    console.error("[ADMIN GET LEADERSHIP ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leadership messages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    if (!body.leaderName || !body.designation || !body.message) {
      return NextResponse.json(
        { success: false, error: "Leader name, designation, and message are required." },
        { status: 400 }
      );
    }

    const newLeadership = await LeadershipMessageModel.create({
      ...body,
      institution:
        body.institution ||
        "Tatyasaheb Kore Institute of Engineering and Technology (TKIET)",
      order: Number(body.order) || 1,
    });

    return NextResponse.json({ success: true, data: newLeadership });
  } catch (error) {
    console.error("[ADMIN CREATE LEADERSHIP ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create leadership entry." },
      { status: 500 }
    );
  }
}
