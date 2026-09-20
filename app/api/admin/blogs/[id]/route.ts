import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import BlogModel from "@/models/Blog";
import CommentModel from "@/models/Comment";
import {
  sanitizeBlogContent,
  stripHtmlToPlainText,
  computeReadTime,
  validateReferences,
  validateImages,
} from "@/lib/utils/blog-validation";

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

    const updateData: any = { ...body };

    if (body.content !== undefined) {
      updateData.content = sanitizeBlogContent(body.content);
      if (!body.excerpt) {
        updateData.excerpt = stripHtmlToPlainText(updateData.content).slice(0, 180) + "...";
      }
      if (!body.readTimeMinutes) {
        updateData.readTimeMinutes = computeReadTime(updateData.content);
      }
    }

    if (body.images !== undefined) {
      updateData.images = validateImages(body.images);
      if (updateData.images.length > 0) {
        updateData.coverImage = updateData.images[0].url;
      }
    }

    if (body.references !== undefined) {
      updateData.references = validateReferences(body.references);
    }

    if (body.author) {
      updateData.author = body.author.trim();
    }

    if (body.publishedAt) {
      updateData.publishedAt = new Date(body.publishedAt);
    }

    const updated = await BlogModel.findByIdAndUpdate(
      params.id,
      updateData,
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

    // Cascade delete all comments belonging to this article
    await CommentModel.deleteMany({
      $or: [{ blogId: params.id }, { blogSlug: deleted.slug }],
    });

    return NextResponse.json({ success: true, message: "Article and associated comments deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE BLOG ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete article." },
      { status: 500 }
    );
  }
}
