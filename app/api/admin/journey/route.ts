import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import JourneyModel from "@/models/Journey";
import { CANONICAL_JOURNEY_MILESTONES } from "@/lib/data/journeyData";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: CANONICAL_JOURNEY_MILESTONES,
        source: "canonical",
      });
    }

    const milestones = await JourneyModel.find().sort({ order: 1, year: 1 });
    return NextResponse.json({
      success: true,
      data: milestones.length > 0 ? milestones : CANONICAL_JOURNEY_MILESTONES,
      source: milestones.length > 0 ? "database" : "canonical",
    });
  } catch (error) {
    console.error("[ADMIN GET JOURNEY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch journey milestones." },
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

    if (!body.year || !body.title || !body.description) {
      return NextResponse.json(
        { success: false, error: "Year, title, and description are required." },
        { status: 400 }
      );
    }

    const count = await JourneyModel.countDocuments();
    const milestone = await JourneyModel.create({
      year: body.year,
      title: body.title,
      label: body.label || body.phaseLabel || `Phase ${count + 1}`,
      summary: body.summary || body.description.substring(0, 140),
      description: body.description,
      highlightMetric: body.highlightMetric || body.metric || "",
      accent: body.accent || body.planetType || "oceanic",
      image: body.image || "",
      detailedStory: body.detailedStory || "",
      published: body.published !== false,
      order: Number(body.order) || count + 1,
    });

    return NextResponse.json({ success: true, data: milestone });
  } catch (error) {
    console.error("[ADMIN CREATE JOURNEY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create journey milestone." },
      { status: 500 }
    );
  }
}
