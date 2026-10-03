import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import BlogModel from "@/models/Blog";

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
 * Records time a reader spent on a blog post.
 * Updates totalReadTimeSeconds and recalculates avgReadTimeSeconds.
 * Sent via navigator.sendBeacon on page unload — body is text/plain JSON.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    let seconds: number;

    try {
      // sendBeacon sends text/plain; fetch can send application/json — handle both
      const text = await request.text();
      const parsed = JSON.parse(text);
      seconds = Number(parsed?.seconds);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid body." }, { status: 400 });
    }

    if (!Number.isFinite(seconds) || seconds < MIN_SECONDS || seconds > MAX_SECONDS) {
      // Silently discard out-of-range values — not an error
      return NextResponse.json({ success: true, recorded: false });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: false, error: "DB unavailable." }, { status: 503 });
    }

    const { slug } = params;

    // Fetch current aggregate so we can compute new avg
    const blog = await BlogModel.findOne({ slug, published: true }).select(
      "views totalReadTimeSeconds avgReadTimeSeconds"
    );

    if (!blog) {
      return NextResponse.json({ success: false, error: "Article not found." }, { status: 404 });
    }

    const prevTotal = blog.totalReadTimeSeconds || 0;
    const prevViews = blog.views || 1; // at minimum 1 since user is reading
    const newTotal = prevTotal + seconds;
    // avgReadTimeSeconds = running cumulative avg (total / views)
    const newAvg = Math.round(newTotal / prevViews);

    await BlogModel.findByIdAndUpdate(blog._id, {
      $inc: { totalReadTimeSeconds: seconds },
      $set: { avgReadTimeSeconds: newAvg },
    });

    return NextResponse.json({ success: true, recorded: true });
  } catch (error) {
    console.error("[BLOG TIME POST ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to record time." }, { status: 500 });
  }
}
