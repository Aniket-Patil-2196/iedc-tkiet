import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import BlogModel from "@/models/Blog";
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

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const author = typeof body.author === "string" ? body.author.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const rawContent = typeof body.content === "string" ? body.content : "";
    const publishedAtRaw = body.publishedAt || body.publicationDate;

    if (!title || !author || !excerpt || !rawContent.trim() || !publishedAtRaw) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, author, date, excerpt, and content are required.",
        },
        { status: 400 }
      );
    }

    const slug = slugifyBlogSlug(body.slug || title);
    if (!isValidBlogSlug(slug)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid URL-safe slug is required (lowercase letters, numbers, hyphens).",
        },
        { status: 400 }
      );
    }

    const sanitizedContent = sanitizeBlogContent(rawContent);
    if (!sanitizedContent) {
      return NextResponse.json(
        { success: false, error: "Content is required." },
        { status: 400 }
      );
    }

    const finalExcerpt =
      excerpt || stripHtmlToPlainText(sanitizedContent).slice(0, 180) + "...";
    const readTimeMinutes =
      Number(body.readTimeMinutes) || computeReadTime(sanitizedContent);

    const images = validateImages(body.images || []);
    if (images.length === 0 && body.coverImage) {
      images.push({
        url: body.coverImage,
        alt: title,
        order: 0,
      });
    }
    const references = validateReferences(body.references || []);

    const publishedAt = new Date(publishedAtRaw);
    if (Number.isNaN(publishedAt.getTime())) {
      return NextResponse.json(
        { success: false, error: "A valid publication date is required." },
        { status: 400 }
      );
    }

    const newBlog = await BlogModel.create({
      slug,
      title,
      excerpt: finalExcerpt,
      content: sanitizedContent,
      author,
      coverImage: images[0]?.url || body.coverImage || "",
      images,
      references,
      publicationDate:
        body.publicationDate || publishedAt.toISOString().split("T")[0],
      publishedAt,
      readTimeMinutes,
      published: Boolean(body.published),
      isFeatured: Boolean(body.isFeatured),
      category: normalizeOptionalText(body.category),
      tags: normalizeBlogTags(body.tags),
      location: normalizeOptionalText(body.location),
      seo: normalizeBlogSeo(body.seo),
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
