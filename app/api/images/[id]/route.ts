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
      console.warn(`[IMAGE SERVE 404] Document ${id} not found in Image collection`);
      return NextResponse.json(
        { success: false, error: "Image not found." },
        { status: 404 }
      );
    }

    // Convert BSON Binary or Buffer to Node.js Buffer (BSON .buffer is Uint8Array/Buffer)
    const rawData = (image.data as any).buffer || image.data;
    const buffer = Buffer.isBuffer(rawData)
      ? rawData
      : Buffer.from(rawData);

    if (!buffer || buffer.length === 0) {
      console.error(`[IMAGE SERVE 404] Image ${id} has 0 bytes in database`);
      return NextResponse.json(
        { success: false, error: "Image data is empty." },
        { status: 404 }
      );
    }

    console.log(`[IMAGE SERVE 200] ${id}: ${buffer.length} bytes, contentType: ${image.contentType}`);

    // ETag based on immutable document _id
    const etag = `"${id}"`;

    // Check If-None-Match for 304
    const ifNoneMatch = _request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": image.contentType || "image/webp",
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
