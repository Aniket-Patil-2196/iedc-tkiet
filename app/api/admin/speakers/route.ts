import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import PreviousSpeakerModel from "@/models/PreviousSpeaker";
import { PLACEHOLDER_SPEAKERS } from "@/lib/data/placeholders";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: PLACEHOLDER_SPEAKERS,
        source: "placeholder",
      });
    }

    const speakers = await PreviousSpeakerModel.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });
    return NextResponse.json({
      success: true,
      data: speakers.length > 0 ? speakers : PLACEHOLDER_SPEAKERS,
      source: speakers.length > 0 ? "database" : "placeholder",
    });
  } catch (error) {
    console.error("[ADMIN GET SPEAKERS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch speakers." },
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
        {
          success: false,
          error: "Database not connected. Please configure MONGODB_URI.",
        },
        { status: 503 }
      );
    }

    if (!body.name || !body.designation || !body.photo) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, designation, and photo are required.",
        },
        { status: 400 }
      );
    }

    const newSpeaker = await PreviousSpeakerModel.create({
      name: body.name.trim(),
      designation: body.designation.trim(),
      organization: body.organization?.trim() || "",
      photo: body.photo.trim(),
      shortDescription: body.shortDescription?.trim() || "",
      eventAssociation: body.eventAssociation?.trim() || "",
      displayOrder: Number(body.displayOrder) || 0,
      published: body.published !== false,
    });

    return NextResponse.json({ success: true, data: newSpeaker });
  } catch (error) {
    console.error("[ADMIN CREATE SPEAKER ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create speaker record." },
      { status: 500 }
    );
  }
}
