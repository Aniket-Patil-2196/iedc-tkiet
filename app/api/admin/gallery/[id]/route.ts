import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import GalleryImageModel from "@/models/GalleryImage";
import ImageModel from "@/models/Image";
import { ingestImage } from "@/lib/utils/image-ingest";

export const runtime = "nodejs";

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
    console.log("[GALLERY UPDATE INCOMING]", {
      id: params.id,
      title: body?.title,
      incomingImageUrl: body?.imageUrl,
      order: body?.order,
    });

    let finalImageUrl = body.imageUrl;

    // Ingest external image URL if updated
    if (body.imageUrl) {
      const ingestResult = await ingestImage(body.imageUrl);
      if (!ingestResult.success) {
        console.warn("[GALLERY UPDATE INGEST REJECTED]", ingestResult.error);
        return NextResponse.json(
          { success: false, error: ingestResult.error },
          { status: 400 }
        );
      }
      finalImageUrl = ingestResult.url || body.imageUrl;
    }

    // If imageUrl is changing, check if we need to delete the old Image document
    if (finalImageUrl !== undefined) {
      const existing = await GalleryImageModel.findById(params.id)
        .select("imageUrl")
        .lean();
      if (existing) {
        const oldImageId = extractImageId((existing as any).imageUrl);
        const newImageId = extractImageId(finalImageUrl);
        // Only delete if old URL was internal AND it's changing to a different URL
        if (oldImageId && oldImageId !== newImageId) {
          await ImageModel.findByIdAndDelete(oldImageId).catch(() => {
            console.warn(`[GALLERY] Could not delete old image ${oldImageId}`);
          });
        }
      }
    }

    const updateData: Record<string, any> = {
      ...body,
      imageUrl: finalImageUrl,
    };

    if (body.tags && typeof body.tags === "string") {
      updateData.tags = body.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    const updated = await GalleryImageModel.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Gallery photo not found." },
        { status: 404 }
      );
    }

    console.log("[GALLERY UPDATE STORED]", {
      id: updated._id,
      title: updated.title,
      storedImageUrl: updated.imageUrl,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[ADMIN UPDATE GALLERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update gallery photo." },
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

    console.log("[GALLERY DELETED]", { id: deleted._id, title: deleted.title, imageUrl: deleted.imageUrl });

    // Clean up the stored Image document if it was an internal upload
    const imageId = extractImageId(deleted.imageUrl);
    if (imageId) {
      await ImageModel.findByIdAndDelete(imageId).catch(() => {
        console.warn(`[GALLERY] Could not delete image ${imageId}`);
      });
    }

    return NextResponse.json({ success: true, message: "Photo deleted." });
  } catch (error: any) {
    console.error("[ADMIN DELETE GALLERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete photo." },
      { status: 500 }
    );
  }
}
