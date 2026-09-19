import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import AchievementModel from "@/models/Achievement";
import { PLACEHOLDER_ACHIEVEMENTS } from "@/lib/data/placeholders";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: PLACEHOLDER_ACHIEVEMENTS,
        source: "placeholder",
      });
    }

    const records = await AchievementModel.find().sort({ order: 1, year: -1 });
    return NextResponse.json({
      success: true,
      data: records.length > 0 ? records : PLACEHOLDER_ACHIEVEMENTS,
      source: records.length > 0 ? "database" : "placeholder",
    });
  } catch (error) {
    console.error("[ADMIN GET ACHIEVEMENTS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch achievements." },
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

    if (!body.title || !body.year || !body.description) {
      return NextResponse.json(
        { success: false, error: "Year, title, and citation details are required." },
        { status: 400 }
      );
    }

    const achievement = await AchievementModel.create({
      ...body,
      category: body.category || "Institutional Milestone",
      published: body.published !== false,
      order: Number(body.order) || 1,
    });

    return NextResponse.json({ success: true, data: achievement });
  } catch (error) {
    console.error("[ADMIN CREATE ACHIEVEMENT ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create achievement." },
      { status: 500 }
    );
  }
}
