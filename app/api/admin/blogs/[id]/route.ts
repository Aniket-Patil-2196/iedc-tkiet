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
  slugifyBlogSlug,
  isValidBlogSlug,
  normalizeBlogTags,
  normalizeOptionalText,
  normalizeBlogSeo,
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
    const updateData: Record<string, unknown> = {};

    // Only apply explicitly provided fields — never strip missing legacy data
    if (body.title !== undefined) {
      const title = String(body.title || "").trim();
      if (!title) {
        return NextResponse.json(
          { success: false, error: "Title is required." },
          { status: 400 }
        );
      }
      updateData.title = title;
    }

    if (body.author !== undefined) {
      const author = String(body.author || "").trim();
      if (!author) {
        return NextResponse.json(
          { success: false, error: "Author is required." },
          { status: 400 }
        );
      }
      updateData.author = author;
    }

    if (body.excerpt !== undefined) {
      const excerpt = String(body.excerpt || "").trim();
      if (!excerpt) {
        return NextResponse.json(
          { success: false, error: "Excerpt is required." },
          { status: 400 }
        );
      }
      updateData.excerpt = excerpt;
    }

    if (body.content !== undefined) {
      const sanitized = sanitizeBlogContent(body.content);
      if (!sanitized) {
        return NextResponse.json(
          { success: false, error: "Content is required." },
          { status: 400 }
        );
      }
      updateData.content = sanitized;
      if (body.excerpt === undefined) {
        updateData.excerpt =
          stripHtmlToPlainText(sanitized).slice(0, 180) + "...";
      }
      if (body.readTimeMinutes === undefined) {
        updateData.readTimeMinutes = computeReadTime(sanitized);
      }
    }

    // Slug: only update when explicitly provided — NEVER regenerate from title
    if (body.slug !== undefined) {
      const slug = slugifyBlogSlug(body.slug);
      if (!isValidBlogSlug(slug)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A valid URL-safe slug is required (lowercase letters, numbers, hyphens).",
          },
          { status: 400 }
        );
      }
      updateData.slug = slug;
    }

    if (body.images !== undefined) {
      updateData.images = validateImages(body.images);
      if ((updateData.images as ReturnType<typeof validateImages>).length > 0) {
        updateData.coverImage = (updateData.images as ReturnType<typeof validateImages>)[0].url;
      }
    }

    if (body.references !== undefined) {
      updateData.references = validateReferences(body.references);
    }

    if (body.publishedAt !== undefined) {
      const publishedAt = new Date(body.publishedAt);
      if (Number.isNaN(publishedAt.getTime())) {
        return NextResponse.json(
          { success: false, error: "A valid publication date is required." },
          { status: 400 }
        );
      }
      updateData.publishedAt = publishedAt;
    }

    if (body.publicationDate !== undefined) {
      updateData.publicationDate = body.publicationDate;
    }

    if (body.readTimeMinutes !== undefined) {
      updateData.readTimeMinutes = Number(body.readTimeMinutes) || 4;
    }

    if (body.published !== undefined) {
      updateData.published = Boolean(body.published);
    }

    if (body.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(body.isFeatured);
    }

    if (body.coverImage !== undefined) {
      updateData.coverImage = body.coverImage;
    }

    if (body.category !== undefined) {
      updateData.category = normalizeOptionalText(body.category);
    }

    if (body.tags !== undefined) {
      updateData.tags = normalizeBlogTags(body.tags);
    }

    if (body.location !== undefined) {
      updateData.location = normalizeOptionalText(body.location);
    }

    if (body.seo !== undefined) {
      updateData.seo = normalizeBlogSeo(body.seo) ?? null;
    }

    const updated = await BlogModel.findByIdAndUpdate(params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Article not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("[ADMIN UPDATE BLOG ERROR]", error);
    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: "An article with this slug already exists." },
        { status: 409 }
      );
    }
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

    return NextResponse.json({
      success: true,
      message: "Article and associated comments deleted.",
    });
  } catch (error) {
    console.error("[ADMIN DELETE BLOG ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete article." },
      { status: 500 }
    );
  }
}
