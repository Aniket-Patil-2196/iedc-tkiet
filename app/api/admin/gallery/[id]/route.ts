import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import GalleryImageModel from "@/models/GalleryImage";

interface Params {
  params: { id: string };
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

    return NextResponse.json({ success: true, message: "Photo deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE GALLERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete photo." },
      { status: 500 }
    );
  }
}
