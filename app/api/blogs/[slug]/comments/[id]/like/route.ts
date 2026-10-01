import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb/client";
import CommentModel from "@/models/Comment";
import { hashClientIp, getClientIp } from "@/lib/utils/comment-security";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
    id: string;
  };
}

function getOrCreateVisitorId(request: Request): { visitorId: string; isNew: boolean } {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)iedc_vid=([^;]+)/);
  if (match && match[1]) {
    return { visitorId: decodeURIComponent(match[1]), isNew: false };
  }
  // Fallback to IP if cookie unavailable
  const ip = getClientIp(request);
  return { visitorId: `ip_${ip}_${crypto.randomUUID().slice(0, 8)}`, isNew: true };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const { slug, id } = params;

    const { visitorId, isNew } = getOrCreateVisitorId(request);
    const { ipHash: visitorHash } = hashClientIp(visitorId);

    if (!visitorHash) {
      return NextResponse.json(
        { success: false, error: "Security configuration error." },
        { status: 500 }
      );
    }

    // Find the comment and its current likedBy list
    const comment = await CommentModel.findOne({ _id: id, blogSlug: slug }).select(
      "_id likesCount +likedBy"
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment not found." },
        { status: 404 }
      );
    }

    const alreadyLiked = Array.isArray(comment.likedBy) && comment.likedBy.includes(visitorHash);

    let updatedComment;
    if (alreadyLiked) {
      // Unlike: remove from array and decrement
      updatedComment = await CommentModel.findByIdAndUpdate(
        id,
        {
          $pull: { likedBy: visitorHash },
          $inc: { likesCount: -1 },
        },
        { new: true }
      ).select("_id likesCount");
    } else {
      // Like: add to array and increment
      updatedComment = await CommentModel.findByIdAndUpdate(
        id,
        {
          $addToSet: { likedBy: visitorHash },
          $inc: { likesCount: 1 },
        },
        { new: true }
      ).select("_id likesCount");
    }

    // Ensure likesCount never drops below 0
    const finalLikesCount = Math.max(0, updatedComment?.likesCount ?? 0);
    if (updatedComment && updatedComment.likesCount < 0) {
      await CommentModel.findByIdAndUpdate(id, { $set: { likesCount: 0 } });
    }

    const response = NextResponse.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: finalLikesCount,
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
    console.error("[COMMENT LIKE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update like status." },
      { status: 500 }
    );
  }
}
