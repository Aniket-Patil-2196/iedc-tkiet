import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb/client";
import CommentModel from "@/models/Comment";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
    id: string;
  };
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const { slug, id } = params;

    // Check for Author token
    const authHeader = request.headers.get("authorization") || "";
    let authorToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

    if (!authorToken) {
      try {
        const body = await request.json();
        if (body.authorToken) authorToken = body.authorToken;
      } catch {}
    }

    const comment = await CommentModel.findOne({ _id: id, blogSlug: slug }).select(
      "_id parentId name body isDeleted +authorTokenHash"
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment not found." },
        { status: 404 }
      );
    }

    // Verify Admin or Author authorization
    const adminSession = await verifyAdminSession();
    let isAuthorized = !!adminSession;

    if (!isAuthorized && authorToken && comment.authorTokenHash) {
      const tokenHash = crypto.createHash("sha256").update(authorToken).digest("hex");
      if (tokenHash === comment.authorTokenHash) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You can only delete your own comments." },
        { status: 403 }
      );
    }

    // Check if this comment has nested replies
    const hasReplies = (await CommentModel.countDocuments({ parentId: id })) > 0;

    if (hasReplies && !adminSession) {
      // For author deletion with replies: soft delete to keep the thread intact
      await CommentModel.findByIdAndUpdate(id, {
        $set: {
          isDeleted: true,
          body: "[This comment was deleted by the author]",
          name: "[deleted]",
        },
      });
      return NextResponse.json({
        success: true,
        message: "Comment marked as deleted.",
        softDeleted: true,
      });
    }

    // Otherwise, or if admin permanently deleting
    await CommentModel.findByIdAndDelete(id);
    return NextResponse.json({
      success: true,
      message: "Comment permanently removed.",
      softDeleted: false,
    });
  } catch (error) {
    console.error("[COMMENT DELETE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete comment." },
      { status: 500 }
    );
  }
}
