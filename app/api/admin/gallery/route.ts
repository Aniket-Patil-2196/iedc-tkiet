import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import GalleryImageModel from "@/models/GalleryImage";
import { PLACEHOLDER_GALLERY } from "@/lib/data/placeholders";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: PLACEHOLDER_GALLERY,
        source: "placeholder",
      });
    }

    const photos = await GalleryImageModel.find().sort({ order: 1 });
    return NextResponse.json({
      success: true,
      data: photos.length > 0 ? photos : PLACEHOLDER_GALLERY,
      source: photos.length > 0 ? "database" : "placeholder",
    });
  } catch (error) {
    console.error("[ADMIN GET GALLERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery photos." },
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

    if (!body.title || !body.imageUrl) {
      return NextResponse.json(
        { success: false, error: "Title and Image URL/asset are required." },
        { status: 400 }
      );
    }

    const tags = Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === "string"
      ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : ["Gallery"];

    const photo = await GalleryImageModel.create({
      ...body,
      tags,
      published: body.published !== false,
      order: Number(body.order) || 1,
    });

    return NextResponse.json({ success: true, data: photo });
  } catch (error) {
    console.error("[ADMIN CREATE GALLERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create gallery entry." },
      { status: 500 }
    );
  }
}
