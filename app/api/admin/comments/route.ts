import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CommentModel from "@/models/Comment";
import BlogModel from "@/models/Blog";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to moderation controls." },
        { status: 401 }
      );
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const blogSlug = searchParams.get("blogSlug");
    const type = searchParams.get("type"); // "all" | "roots" | "replies" | "reported"
    const sort = searchParams.get("sort") || "newest"; // "newest" | "oldest"
    const search = searchParams.get("search");

    const query: any = {};
    if (blogSlug && blogSlug !== "all") {
      query.blogSlug = blogSlug;
    }

    if (type === "roots") {
      query.parentId = null;
    } else if (type === "replies") {
      query.parentId = { $ne: null };
    } else if (type === "reported") {
      query.reportsCount = { $gt: 0 };
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { body: { $regex: q, $options: "i" } },
      ];
    }

    const sortOrder = sort === "oldest" ? 1 : -1;

    // Fetch comments with email (admin authorized context)
    const comments = await CommentModel.find(query)
      .select("+email")
      .sort({ createdAt: sortOrder })
      .lean();

    // Map blog titles
    const allBlogs = await BlogModel.find()
      .select("slug title")
      .sort({ title: 1 })
      .lean();
    const blogMap = new Map(allBlogs.map((b) => [b.slug, b.title]));

    // Build comment map to look up parent details and count replies
    const commentMap = new Map(comments.map((c) => [c._id.toString(), c]));

    // Count replies for root comments
    const replyCounts: Record<string, number> = {};
    comments.forEach((c: any) => {
      if (c.parentId) {
        const pId = c.parentId.toString();
        replyCounts[pId] = (replyCounts[pId] || 0) + 1;
      }
    });

    const enrichedComments = comments.map((c: any) => {
      const parentIdStr = c.parentId ? c.parentId.toString() : null;
      const parentComment = parentIdStr ? commentMap.get(parentIdStr) : null;

      return {
        _id: c._id.toString(),
        blogId: c.blogId?.toString(),
        blogSlug: c.blogSlug,
        blogTitle: blogMap.get(c.blogSlug) || c.blogSlug,
        parentId: parentIdStr,
        parentAuthor: parentComment?.name || c.replyToUser || null,
        parentBodySnippet: parentComment
          ? parentComment.body.slice(0, 80) + (parentComment.body.length > 80 ? "..." : "")
          : null,
        replyCount: replyCounts[c._id.toString()] || 0,
        name: c.name,
        email: c.email || "",
        body: c.body,
        likesCount: c.likesCount || 0,
        reportsCount: c.reportsCount || 0,
        isDeleted: !!c.isDeleted,
        status: c.status || "approved",
        adminReply: c.adminReply || "",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedComments,
      blogs: allBlogs.map((b) => ({ slug: b.slug, title: b.title })),
    });
  } catch (error) {
    console.error("[ADMIN COMMENTS LIST ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments." },
      { status: 500 }
    );
  }
}
