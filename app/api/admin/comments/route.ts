import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CommentModel from "@/models/Comment";
import BlogModel from "@/models/Blog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const blogSlug = searchParams.get("blogSlug");

    const query: any = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }
    if (blogSlug) {
      query.blogSlug = blogSlug;
    }

    // In admin context, email can be selected for verification, but ipHash remains omitted
    const comments = await CommentModel.find(query)
      .select("+email")
      .sort({ createdAt: -1 })
      .lean();

    // Map blog titles if available
    const blogSlugs = Array.from(new Set(comments.map((c) => c.blogSlug)));
    const blogs = await BlogModel.find({ slug: { $in: blogSlugs } })
      .select("slug title")
      .lean();
    const blogMap = new Map(blogs.map((b) => [b.slug, b.title]));

    const enrichedComments = comments.map((c: any) => ({
      _id: c._id.toString(),
      blogId: c.blogId?.toString(),
      blogSlug: c.blogSlug,
      blogTitle: blogMap.get(c.blogSlug) || c.blogSlug,
      name: c.name,
      email: c.email || "",
      body: c.body,
      status: c.status,
      adminReply: c.adminReply || "",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedComments,
    });
  } catch (error) {
    console.error("[ADMIN COMMENTS LIST ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments." },
      { status: 500 }
    );
  }
}
