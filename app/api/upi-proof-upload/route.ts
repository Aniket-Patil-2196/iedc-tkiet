import { NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { connectToDatabase } from "@/lib/mongodb/client";
import ImageModel from "@/models/Image";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // Rate limit: 10 uploads per IP per 5 minutes
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`upi-upload:${clientIp}`, 10, 300);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many upload attempts. Please wait ${rateLimit.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file format. Please upload JPG, JPEG, PNG, or WebP only.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_EXT.test(file.name || "")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file extension. Allowed: .jpg, .jpeg, .png, .webp",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "File exceeds 5MB limit." },
        { status: 400 }
      );
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database temporarily unavailable." },
        { status: 503 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const pipeline = sharp(rawBuffer)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 });

    const [processedBuffer, meta] = await Promise.all([
      pipeline.toBuffer(),
      sharp(rawBuffer)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .metadata(),
    ]);

    // Opaque publicId so proof URLs are not sequentially guessable ObjectIds
    const publicId = crypto.randomBytes(24).toString("hex");

    await ImageModel.create({
      data: processedBuffer,
      contentType: "image/webp",
      size: processedBuffer.length,
      width: meta.width,
      height: meta.height,
      publicId,
    });

    const publicUrl = `/api/images/${publicId}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      storage: "mongodb",
      message: "Proof image uploaded successfully.",
    });
  } catch (error: any) {
    console.error("[UPI PROOF UPLOAD ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Upload failed." },
      { status: 500 }
    );
  }
}
