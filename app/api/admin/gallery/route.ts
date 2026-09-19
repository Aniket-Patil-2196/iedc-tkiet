import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import GalleryImageModel from "@/models/GalleryImage";
import { ingestImage } from "@/lib/utils/image-ingest";

export const runtime = "nodejs";

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

    // Auto-clean any legacy broken records (e.g. pasted HTML Pinterest pin links)
    await GalleryImageModel.deleteMany({
      imageUrl: { $regex: /pinterest\.com\/pin/i },
    }).catch(() => {});

    const photos = await GalleryImageModel.find().sort({ order: 1 });
    return NextResponse.json({
      success: true,
      data: photos,
      source: "database",
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
    console.log("[GALLERY CREATE INCOMING]", {
      title: body?.title,
      incomingImageUrl: body?.imageUrl,
      order: body?.order,
    });

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

    // Ingest and validate external images (downloads, SSRF-protects, sharp-optimizes, stores in MongoDB)
    const ingestResult = await ingestImage(body.imageUrl);
    if (!ingestResult.success) {
      console.warn("[GALLERY CREATE INGEST REJECTED]", ingestResult.error);
      return NextResponse.json(
        { success: false, error: ingestResult.error },
        { status: 400 }
      );
    }
    const finalImageUrl = ingestResult.url || body.imageUrl;

    const tags = Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === "string"
      ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : ["Gallery"];

    const photo = await GalleryImageModel.create({
      title: body.title,
      caption: body.caption || "",
      imageUrl: finalImageUrl,
      aspectRatio: body.aspectRatio || "square",
      tags,
      eventRefId: body.eventRefId,
      published: body.published !== false,
      order: Number(body.order) || 1,
    });

    console.log("[GALLERY CREATE STORED]", {
      id: photo._id,
      title: photo.title,
      storedImageUrl: photo.imageUrl,
    });

    return NextResponse.json({ success: true, data: photo });
  } catch (error: any) {
    console.error("[ADMIN CREATE GALLERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create gallery entry." },
      { status: 500 }
    );
  }
}
