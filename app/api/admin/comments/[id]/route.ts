import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CommentModel from "@/models/Comment";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
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

    const body = await request.json();
    const updateData: any = {};

    if (body.status !== undefined) {
      if (!["pending", "approved", "rejected", "flagged"].includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status value." },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.adminReply !== undefined) {
      updateData.adminReply = String(body.adminReply).trim().slice(0, 1000);
    }

    const updated = await CommentModel.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Comment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Comment updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("[ADMIN COMMENT PATCH ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update comment." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
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

    const target = await CommentModel.findById(params.id);
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Comment not found." },
        { status: 404 }
      );
    }

    // Delete child replies if this was a parent comment
    const repliesDeleteResult = await CommentModel.deleteMany({ parentId: params.id });
    const deletedRepliesCount = repliesDeleteResult.deletedCount || 0;

    // Delete the target comment itself
    await CommentModel.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message:
        deletedRepliesCount > 0
          ? `Comment and ${deletedRepliesCount} associated reply thread(s) permanently deleted.`
          : "Comment permanently deleted.",
      deletedRepliesCount,
    });
  } catch (error) {
    console.error("[ADMIN COMMENT DELETE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete comment." },
      { status: 500 }
    );
  }
}
