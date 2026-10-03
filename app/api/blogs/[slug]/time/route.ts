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

const MIN_SECONDS = 3;   // ignore bounces under 3s
const MAX_SECONDS = 3600; // cap at 1 hour to ignore idle tabs

/**
 * POST /api/blogs/[slug]/time
 * Body: { seconds: number }
 *
 * Records elapsed read time from navigator.sendBeacon or fetch.
 * Uses rate limiting to prevent spam and updates running avgReadTimeSeconds.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`blog_time:${clientIp}`, 60, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded." },
        { status: 429 }
      );
    }

    let seconds: number;
    try {
      const text = await request.text();
      const parsed = JSON.parse(text);
      seconds = Number(parsed?.seconds);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid body." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(seconds) || seconds < MIN_SECONDS || seconds > MAX_SECONDS) {
      return NextResponse.json({ success: true, recorded: false });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "DB unavailable." },
        { status: 503 }
      );
    }

    const { slug } = params;

    const blog = await BlogModel.findOne({ slug, published: true }).select(
      "views totalReadTimeSeconds avgReadTimeSeconds"
    );

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Article not found." },
        { status: 404 }
      );
    }

    const prevTotal = blog.totalReadTimeSeconds || 0;
    const prevViews = Math.max(1, blog.views || 1);
    const newTotal = prevTotal + seconds;
    const newAvg = Math.round(newTotal / prevViews);

    await BlogModel.findByIdAndUpdate(blog._id, {
      $inc: { totalReadTimeSeconds: seconds },
      $set: { avgReadTimeSeconds: newAvg },
    });

    return NextResponse.json({
      success: true,
      recorded: true,
      avgReadTimeSeconds: newAvg,
    });
  } catch (error) {
    console.error("[BLOG TIME POST ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to record time." },
      { status: 500 }
    );
  }
}
