import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import BlogModel from "@/models/Blog";
import {
  sanitizeBlogContent,
  stripHtmlToPlainText,
  computeReadTime,
  validateReferences,
  validateImages,
} from "@/lib/utils/blog-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: [],
        source: "no-connection",
      });
    }

    const blogs = await BlogModel.find().sort({ publishedAt: -1, publicationDate: -1, createdAt: -1 });
    return NextResponse.json({
      success: true,
      data: blogs,
      source: "database",
    });
  } catch (error) {
    console.error("[ADMIN GET BLOGS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    if (!body.title || (!body.excerpt && !body.content)) {
      return NextResponse.json(
        { success: false, error: "Title and content are required." },
        { status: 400 }
      );
    }

    const rawSlug = body.slug || body.title;
    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const sanitizedContent = sanitizeBlogContent(body.content || "");
    const excerpt = body.excerpt?.trim() || stripHtmlToPlainText(sanitizedContent).slice(0, 180) + "...";
    const readTimeMinutes = Number(body.readTimeMinutes) || computeReadTime(sanitizedContent);

    // Validate images and references
    const images = validateImages(body.images || []);
    // Fallback: if body.coverImage provided and images is empty, add it as first image
    if (images.length === 0 && body.coverImage) {
      images.push({
        url: body.coverImage,
        alt: body.title,
      });
    }
    const references = validateReferences(body.references || []);

    const publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();

    const newBlog = await BlogModel.create({
      slug,
      title: body.title.trim(),
      excerpt,
      content: sanitizedContent,
      author: body.author?.trim() || "IEDC TKIET",
      coverImage: images[0]?.url || body.coverImage || "",
      images,
      references,
      publicationDate:
        body.publicationDate || publishedAt.toISOString().split("T")[0],
      publishedAt,
      readTimeMinutes,
      published: Boolean(body.published),
      isFeatured: Boolean(body.isFeatured),
      tags: Array.isArray(body.tags) ? body.tags : [],
    });

    return NextResponse.json({ success: true, data: newBlog });
  } catch (error: unknown) {
    console.error("[ADMIN CREATE BLOG ERROR]", error);
    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: "An article with this slug already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create blog article." },
      { status: 500 }
    );
  }
}
