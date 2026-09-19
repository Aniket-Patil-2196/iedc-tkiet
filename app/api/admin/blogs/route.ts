import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import BlogModel from "@/models/Blog";

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

    const blogs = await BlogModel.find().sort({ publicationDate: -1, createdAt: -1 });
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

    if (!body.title || !body.excerpt || !body.content) {
      return NextResponse.json(
        { success: false, error: "Title, excerpt, and content are required." },
        { status: 400 }
      );
    }

    const rawSlug = body.slug || body.title;
    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const newBlog = await BlogModel.create({
      ...body,
      slug,
      author: "IEDC TKIET", // Strictly fixed institutional author per spec
      publicationDate:
        body.publicationDate || new Date().toISOString().split("T")[0],
      readTimeMinutes: Number(body.readTimeMinutes) || 4,
      published: Boolean(body.published),
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
