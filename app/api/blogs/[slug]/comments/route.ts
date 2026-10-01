import { NextResponse } from "next/server";
import crypto from "crypto";
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
  let blog: any = await BlogModel.findOne({ slug, published: true }).select("_id slug title published");
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
        blog = await BlogModel.findOne({ slug, published: true }).select("_id slug title published");
      }
    }
  }
  return blog;
}

// Helper to extract or initialize visitor identifier
function getOrCreateVisitorId(request: Request): { visitorId: string; isNew: boolean } {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)iedc_vid=([^;]+)/);
  if (match && match[1]) {
    return { visitorId: decodeURIComponent(match[1]), isNew: false };
  }
  return { visitorId: crypto.randomUUID(), isNew: true };
}

// Public GET: Fetch all active comments and replies for a published article
export async function GET(request: Request, { params }: RouteParams) {
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

    const { visitorId, isNew } = getOrCreateVisitorId(request);
    const { ipHash: visitorHash } = hashClientIp(visitorId);

    // Fetch all comments that are not rejected
    // Include likedBy to determine if current visitor liked each comment
    const comments = await CommentModel.find({
      blogSlug: slug,
      status: { $ne: "rejected" },
    })
      .sort({ createdAt: 1 })
      .select("_id parentId replyToUser name body likesCount isDeleted createdAt adminReply +likedBy")
      .lean();

    const likedCommentIds: string[] = [];

    const sanitizedComments = comments.map((c: any) => {
      const idStr = c._id.toString();
      if (visitorHash && Array.isArray(c.likedBy) && c.likedBy.includes(visitorHash)) {
        likedCommentIds.push(idStr);
      }

      return {
        _id: idStr,
        parentId: c.parentId ? c.parentId.toString() : null,
        replyToUser: c.replyToUser || null,
        name: c.isDeleted ? "[deleted]" : c.name,
        body: c.isDeleted ? "[This comment was deleted by the author]" : c.body,
        likesCount: Math.max(0, c.likesCount || 0),
        isDeleted: !!c.isDeleted,
        createdAt: c.createdAt,
        adminReply: c.adminReply || null,
      };
    });

    const response = NextResponse.json(
      {
        success: true,
        data: sanitizedComments,
        likedCommentIds,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );

    if (isNew) {
      response.cookies.set({
        name: "iedc_vid",
        value: visitorId,
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    console.error("[COMMENTS GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments." },
      { status: 500 }
    );
  }
}

// Public POST: Submit a comment or nested reply (Published immediately)
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

    // 1. Cross-Origin Protection
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const originHost = new URL(origin).host.toLowerCase();
        const host = request.headers.get("host")?.toLowerCase();
        const allowed = [host, "localhost:3000", "127.0.0.1:3000"];
        if (process.env.NEXT_PUBLIC_SITE_URL) {
          try {
            allowed.push(new URL(process.env.NEXT_PUBLIC_SITE_URL).host.toLowerCase());
          } catch {}
        }
        if (process.env.ALLOWED_ORIGIN) {
          process.env.ALLOWED_ORIGIN.split(",").forEach((o) => {
            try {
              allowed.push(new URL(o.trim()).host.toLowerCase());
            } catch {}
          });
        }
        if (!allowed.includes(originHost)) {
          return NextResponse.json(
            { success: false, error: "Cross-origin comment submission rejected." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid request origin." },
          { status: 403 }
        );
      }
    }

    const bodyData = await request.json();
    const { name, email, body, parentId, replyToUser, website, formLoadedAt } = bodyData;

    // 2. Submission Timing Bot Check: Form must be open for at least 1.5 seconds
    if (formLoadedAt !== undefined) {
      const elapsed = Date.now() - Number(formLoadedAt);
      if (elapsed < 1500) {
        return NextResponse.json(
          {
            success: false,
            error: "Submission received too quickly. Please review your comment before submitting.",
          },
          { status: 429 }
        );
      }
    }

    // 3. Honeypot check: Bots filling in the hidden 'website' field
    if (website && String(website).trim().length > 0) {
      // Silently discard bot submission without saving
      return NextResponse.json(
        {
          success: true,
          message: "Thank you for sharing your thoughts!",
          data: {
            _id: crypto.randomUUID(),
            name: String(name || "").trim(),
            body: String(body || "").trim(),
            createdAt: new Date().toISOString(),
            likesCount: 0,
            parentId: parentId || null,
          },
        },
        { status: 201 }
      );
    }

    // 4. Validate input fields
    const validation = validateCommentInput({ name, email, body });
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 5. If replying, verify parent comment exists
    let resolvedParentId = null;
    let resolvedReplyToUser = null;
    if (parentId) {
      const parentComment = await CommentModel.findOne({
        _id: parentId,
        blogSlug: slug,
      }).select("_id name");

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: "The comment you are replying to no longer exists." },
          { status: 404 }
        );
      }
      resolvedParentId = parentComment._id;
      resolvedReplyToUser = replyToUser?.trim() || parentComment.name;
    }

    // 6. Client IP and salted hash
    const clientIp = getClientIp(request);
    const { ipHash, error: saltError } = hashClientIp(clientIp);

    if (saltError || !ipHash) {
      console.error("[COMMENTS CONFIGURATION ERROR]", saltError);
      return NextResponse.json(
        { success: false, error: "Server configuration error." },
        { status: 500 }
      );
    }

    // 7. Rate limiting: anti-spam checks
    const rateCheck = await checkCommentRateLimits({
      ipHash,
      email: email.trim().toLowerCase(),
      blogSlug: slug,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: rateCheck.message },
        { status: 429 }
      );
    }

    // 8. Generate author token for local deletion/editing authorization
    const authorToken = crypto.randomUUID();
    const authorTokenHash = crypto
      .createHash("sha256")
      .update(authorToken)
      .digest("hex");

    // 9. Store comment with status: "approved" (published immediately)
    const newComment = await CommentModel.create({
      blogId: blog._id,
      blogSlug: slug,
      parentId: resolvedParentId,
      replyToUser: resolvedReplyToUser,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      body: body.trim(),
      likesCount: 0,
      likedBy: [],
      authorTokenHash,
      status: "approved",
      ipHash,
    });

    const { visitorId, isNew } = getOrCreateVisitorId(request);

    const response = NextResponse.json(
      {
        success: true,
        message: "Your remark has been published!",
        authorToken,
        data: {
          _id: newComment._id.toString(),
          parentId: resolvedParentId ? resolvedParentId.toString() : null,
          replyToUser: resolvedReplyToUser,
          name: newComment.name,
          body: newComment.body,
          likesCount: 0,
          isDeleted: false,
          createdAt: newComment.createdAt,
          adminReply: null,
        },
      },
      { status: 201 }
    );

    if (isNew) {
      response.cookies.set({
        name: "iedc_vid",
        value: visitorId,
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    console.error("[COMMENTS POST ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit comment. Please try again later." },
      { status: 500 }
    );
  }
}
