import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/client";
import ImageModel from "@/models/Image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = params;

  // Validate ObjectId format
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid image ID." },
      { status: 404 }
    );
  }

  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const image = await ImageModel.findById(id)
      .select("data contentType")
      .lean();

    if (!image || !image.data) {
      return NextResponse.json(
        { success: false, error: "Image not found." },
        { status: 404 }
      );
    }

    // ETag based on immutable document _id
    const etag = `"${id}"`;

    // Check If-None-Match for 304
    const ifNoneMatch = _request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    // Return raw image bytes with aggressive caching
    const buffer =
      image.data instanceof Buffer
        ? image.data
        : Buffer.from(image.data as any);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
      },
    });
  } catch (error) {
    console.error("[IMAGE SERVE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve image." },
      { status: 500 }
    );
  }
}
