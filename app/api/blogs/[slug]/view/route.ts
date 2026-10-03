import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import BlogModel from "@/models/Blog";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * POST: Atomically records a view for a published blog post.
 * Uses standard rate limiting per client IP (60 req/min) to prevent abuse,
 * while the frontend uses sessionStorage to avoid duplicate view counts per browser session.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`blog_view:${clientIp}`, 60, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded." },
        { status: 429 }
      );
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const { slug } = params;

    // Atomically increment views and return the updated count + avg read time
    const updated = await BlogModel.findOneAndUpdate(
      { slug, published: true },
      { $inc: { views: 1 } },
      { new: true }
    ).select("views avgReadTimeSeconds");

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Article not found or not published." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      views: updated.views,
      avgReadTimeSeconds: updated.avgReadTimeSeconds || 0,
      incremented: true,
    });
  } catch (error) {
    console.error("[BLOG VIEW POST ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to record view." },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieves current view count and average read time.
 */
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
    const blog = await BlogModel.findOne({ slug, published: true }).select(
      "views avgReadTimeSeconds"
    );

    return NextResponse.json({
      success: true,
      views: blog?.views || 0,
      avgReadTimeSeconds: blog?.avgReadTimeSeconds || 0,
    });
  } catch (error) {
    console.error("[BLOG VIEW GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch views." },
      { status: 500 }
    );
  }
}
