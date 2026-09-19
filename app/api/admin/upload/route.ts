import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const directUrl = formData.get("url") as string | null;

    // Direct URL support
    if (directUrl && directUrl.trim()) {
      return NextResponse.json({
        success: true,
        url: directUrl.trim(),
        storage: "external_url",
      });
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file or URL was provided." },
        { status: 400 }
      );
    }

    // Validate mime type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file format. Please upload JPEG, PNG, WebP, or SVG.",
        },
        { status: 400 }
      );
    }

    // Limit file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File exceeds 5MB limit." },
        { status: 400 }
      );
    }

    // Write file to local public/uploads directory (development abstraction)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || ".jpg";
    const cleanBaseName = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const filename = `iedc-${Date.now()}-${cleanBaseName}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      storage: "local_development",
      message: "Asset uploaded successfully.",
    });
  } catch (error) {
    console.error("[IMAGE UPLOAD ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image." },
      { status: 500 }
    );
  }
}
