import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import GalleryImageModel from "@/models/GalleryImage";
import ImageModel from "@/models/Image";

interface Params {
  params: { id: string };
}

/**
 * Extract the MongoDB Image document ID from an internal image URL.
 * Returns null if the URL is not an internal /api/images/ URL.
 */
function extractImageId(url: string | undefined): string | null {
  if (!url || !url.startsWith("/api/images/")) return null;
  const parts = url.split("/");
  return parts[3] || null;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const body = await request.json();
    if (body.tags && typeof body.tags === "string") {
      body.tags = body.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    // If imageUrl is changing, check if we need to delete the old Image document
    if (body.imageUrl !== undefined) {
      const existing = await GalleryImageModel.findById(params.id)
        .select("imageUrl")
        .lean();
      if (existing) {
        const oldImageId = extractImageId((existing as any).imageUrl);
        const newImageId = extractImageId(body.imageUrl);
        // Only delete if old URL was internal AND it's changing to a different URL
        if (oldImageId && oldImageId !== newImageId) {
          await ImageModel.findByIdAndDelete(oldImageId).catch(() => {
            // Non-critical: log but don't fail the update
            console.warn(
              `[GALLERY] Could not delete old image ${oldImageId}`
            );
          });
        }
      }
    }

    const updated = await GalleryImageModel.findByIdAndUpdate(
      params.id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Gallery photo not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN UPDATE GALLERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update gallery photo." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const deleted = await GalleryImageModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Gallery photo not found." },
        { status: 404 }
      );
    }

    // Clean up the stored Image document if it was an internal upload
    const imageId = extractImageId(deleted.imageUrl);
    if (imageId) {
      await ImageModel.findByIdAndDelete(imageId).catch(() => {
        console.warn(`[GALLERY] Could not delete image ${imageId}`);
      });
    }

    return NextResponse.json({ success: true, message: "Photo deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE GALLERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete photo." },
      { status: 500 }
    );
  }
}
