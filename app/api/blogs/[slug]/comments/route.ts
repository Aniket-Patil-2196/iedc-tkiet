import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import BlogModel from "@/models/Blog";
import CommentModel from "@/models/Comment";
import { getPublishedBlogBySlug } from "@/lib/db/queries";
import {
  getClientIp,
  hashClientIp,
  checkCommentRateLimits,
  validateCommentInput,
} from "@/lib/utils/comment-security";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { slug: string };
}

// Helper to find or sync published blog
async function findPublishedBlog(slug: string): Promise<any> {
  let blog: any = await BlogModel.findOne({ slug, published: true }).select("_id slug published");
  if (!blog) {
    const fallback = await getPublishedBlogBySlug(slug);
    if (fallback && fallback.published) {
      try {
        blog = await BlogModel.create({
          slug: fallback.slug,
          title: fallback.title,
          excerpt: fallback.excerpt,
          content: fallback.content,
          author: fallback.author || "IEDC TKIET",
          published: true,
          publishedAt: fallback.publishedAt || new Date(),
          publicationDate: fallback.publicationDate || new Date().toISOString(),
          readTimeMinutes: fallback.readTimeMinutes || 3,
          coverImage: fallback.coverImage,
          images: fallback.images || [],
          references: fallback.references || [],
        });
      } catch {
        blog = await BlogModel.findOne({ slug, published: true }).select("_id slug published");
      }
    }
  }
  return blog;
}

// Public GET: Fetch approved comments for a published article
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database connection failed." },
        { status: 503 }
      );
    }

    const { slug } = params;

    // Unpublished/draft blogs return 404 for comments
    const blog = await findPublishedBlog(slug);
    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Article not found or not published." },
        { status: 404 }
      );
    }

    // Explicit projection: ONLY name, body, createdAt, adminReply.
    // email and ipHash are excluded by schema (select: false) and omitted in projection.
    const comments = await CommentModel.find({
      blogSlug: slug,
      status: "approved",
    })
      .sort({ createdAt: 1 })
      .select("_id name body createdAt adminReply")
      .lean();

    // Redundant privacy filter to guarantee absolute safety
    const sanitizedComments = comments.map((c: any) => ({
      _id: c._id.toString(),
      name: c.name,
      body: c.body,
      createdAt: c.createdAt,
      adminReply: c.adminReply || null,
    }));

    return NextResponse.json(
      { success: true, data: sanitizedComments },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[COMMENTS GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments." },
      { status: 500 }
    );
  }
}

// Public POST: Submit a comment for moderation
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database connection failed." },
        { status: 503 }
      );
    }

    const { slug } = params;

    // Unpublished/draft blogs return 404
    const blog = await findPublishedBlog(slug);
    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Article not found or not published." },
        { status: 404 }
      );
    }

    const bodyData = await request.json();
    const { name, email, body, website } = bodyData;

    // 1. Honeypot check: Bots filling in the hidden 'website' field
    if (website && String(website).trim().length > 0) {
      // Silently discard bot submission without saving or notifying
      return NextResponse.json(
        {
          success: true,
          message: "Thank you! Your comment has been submitted and is awaiting moderation.",
        },
        { status: 201 }
      );
    }

    // 2. Validate input fields
    const validation = validateCommentInput({ name, email, body });
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 3. Client IP and salted hash
    const clientIp = getClientIp(request);
    const { ipHash, error: saltError } = hashClientIp(clientIp);

    if (saltError || !ipHash) {
      console.error("[COMMENTS CONFIGURATION ERROR]", saltError);
      return NextResponse.json(
        { success: false, error: "Server configuration error." },
        { status: 500 }
      );
    }

    // 4. Rate limiting: 3 per 10 min per ipHash, 5 per 24h per email
    const rateCheck = await checkCommentRateLimits({
      ipHash,
      email: email.trim().toLowerCase(),
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: rateCheck.message },
        { status: 429 }
      );
    }

    // 5. Store comment with status: "pending"
    const newComment = await CommentModel.create({
      blogId: blog._id,
      blogSlug: slug,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      body: body.trim(),
      ipHash,
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your comment has been submitted and is awaiting moderation.",
        id: newComment._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[COMMENTS POST ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit comment. Please try again later." },
      { status: 500 }
    );
  }
}
