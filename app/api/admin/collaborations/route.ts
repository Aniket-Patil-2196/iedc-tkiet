import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CollaborationModel from "@/models/Collaboration";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: [],
        source: "no-connection",
      });
    }

    const collabs = await CollaborationModel.find().sort({ order: 1 });
    return NextResponse.json({
      success: true,
      data: collabs,
      source: "database",
    });
  } catch (error) {
    console.error("[ADMIN GET COLLABORATIONS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collaborations." },
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

    if (!body.partnerName || !body.description) {
      return NextResponse.json(
        { success: false, error: "Partner organization name and description are required." },
        { status: 400 }
      );
    }

    const collab = await CollaborationModel.create({
      ...body,
      partnerType: body.partnerType || "Ecosystem Partner",
      order: Number(body.order) || 1,
    });

    return NextResponse.json({ success: true, data: collab });
  } catch (error) {
    console.error("[ADMIN CREATE COLLABORATION ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create collaboration." },
      { status: 500 }
    );
  }
}
