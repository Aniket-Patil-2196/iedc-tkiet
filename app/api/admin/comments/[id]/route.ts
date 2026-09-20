import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CommentModel from "@/models/Comment";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
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
      if (!["pending", "approved", "rejected"].includes(body.status)) {
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
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const deleted = await CommentModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Comment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Comment permanently deleted.",
    });
  } catch (error) {
    console.error("[ADMIN COMMENT DELETE ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete comment." },
      { status: 500 }
    );
  }
}
