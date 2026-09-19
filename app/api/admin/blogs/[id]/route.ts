import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import BlogModel from "@/models/Blog";

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
    // Enforce fixed author strictly
    const updated = await BlogModel.findByIdAndUpdate(
      params.id,
      { ...body, author: "IEDC TKIET" },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Article not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN UPDATE BLOG ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update article." },
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

    const deleted = await BlogModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Article not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Article deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE BLOG ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete article." },
      { status: 500 }
    );
  }
}
