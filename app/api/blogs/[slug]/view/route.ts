import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb/client";
import BlogModel from "@/models/Blog";
import BlogViewModel from "@/models/BlogView";
import { getClientIp } from "@/lib/utils/comment-security";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
  };
}

function getOrCreateVisitorId(request: Request): { visitorId: string; isNew: boolean } {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)iedc_vid=([^;]+)/);
  if (match && match[1]) {
    return { visitorId: decodeURIComponent(match[1]), isNew: false };
  }
  const ip = getClientIp(request);
  return { visitorId: `vid_${crypto.createHash("md5").update(ip).digest("hex").slice(0, 12)}_${crypto.randomUUID().slice(0, 8)}`, isNew: true };
}

// POST: Atomically record a view with deduplication within 2-hour window
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const { slug } = params;
    const { visitorId, isNew } = getOrCreateVisitorId(request);

    // Find the blog
    const blog = await BlogModel.findOne({ slug, published: true }).select("_id slug views");
    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Article not found or not published." },
        { status: 404 }
      );
    }

    let isUniqueViewInWindow = false;

    try {
      // Attempt to insert view record. If same visitor viewed this blog within 2 hours,
      // unique index { blogSlug: 1, visitorId: 1 } throws E11000 duplicate key error.
      await BlogViewModel.create({
        blogSlug: slug,
        visitorId,
      });
      isUniqueViewInWindow = true;
    } catch (err: any) {
      // Duplicate key (code 11000) means already viewed within TTL window
      if (err.code !== 11000) {
        console.warn("[BLOG VIEW TRACKING WARNING]", err?.message);
      }
    }

    let currentViews = blog.views || 0;

    if (isUniqueViewInWindow) {
      // Atomic increment
      const updated = await BlogModel.findByIdAndUpdate(
        blog._id,
        { $inc: { views: 1 } },
        { new: true }
      ).select("views");
      currentViews = updated?.views || currentViews + 1;
    }

    const response = NextResponse.json({
      success: true,
      views: currentViews,
      incremented: isUniqueViewInWindow,
    });

    if (isNew) {
      response.cookies.set({
        name: "iedc_vid",
        value: visitorId,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    console.error("[BLOG VIEW POST ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to record view." },
      { status: 500 }
    );
  }
}

// GET: Fetch current view count
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const { slug } = params;
    const blog = await BlogModel.findOne({ slug }).select("views");

    return NextResponse.json({
      success: true,
      views: blog?.views || 0,
    });
  } catch (error) {
    console.error("[BLOG VIEW GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch views." },
      { status: 500 }
    );
  }
}
