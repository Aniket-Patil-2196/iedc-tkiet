import { NextResponse } from "next/server";
import sharp from "sharp";
import { connectToDatabase } from "@/lib/mongodb/client";
import ImageModel from "@/models/Image";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const directUrl = formData.get("url") as string | null;

    // Direct URL passthrough (pasted external URLs)
    if (directUrl && directUrl.trim()) {
      return NextResponse.json({
        success: true,
        url: directUrl.trim(),
        storage: "external_url",
      });
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file was provided." },
        { status: 400 }
      );
    }

    console.log("[UPLOAD INCOMING FILE]", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate MIME type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file format. Please upload JPEG, PNG, WebP, or GIF.",
        },
        { status: 400 }
      );
    }

    // Validate raw file size (5MB limit before processing)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File exceeds 5MB limit." },
        { status: 400 }
      );
    }

    // Connect to database
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    // Read file buffer
    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Process with sharp: auto-rotate (EXIF), resize, convert to WebP
    const sharpInstance = sharp(rawBuffer)
      .rotate() // Respect EXIF orientation
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 });

    const [processedBuffer, meta] = await Promise.all([
      sharpInstance.toBuffer(),
      sharpInstance.metadata(),
    ]);

    // Save to MongoDB
    const imageDoc = await ImageModel.create({
      data: processedBuffer,
      contentType: "image/webp",
      size: processedBuffer.length,
      width: meta.width,
      height: meta.height,
    });

    const publicUrl = `/api/images/${imageDoc._id}`;
    console.log("[UPLOAD STORED IMAGE]", {
      id: imageDoc._id,
      url: publicUrl,
      size: imageDoc.size,
      width: meta.width,
      height: meta.height,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      width: meta.width,
      height: meta.height,
      storage: "mongodb",
      message: "Image uploaded and optimized successfully.",
    });
  } catch (error: any) {
    console.error("[IMAGE UPLOAD ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to upload image." },
      { status: 500 }
    );
  }
}
