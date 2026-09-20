import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CommentModel from "@/models/Comment";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const [pendingCount, approvedCount, rejectedCount, totalCount] =
      await Promise.all([
        CommentModel.countDocuments({ status: "pending" }),
        CommentModel.countDocuments({ status: "approved" }),
        CommentModel.countDocuments({ status: "rejected" }),
        CommentModel.countDocuments(),
      ]);

    return NextResponse.json({
      success: true,
      stats: {
        pendingCount,
        approvedCount,
        rejectedCount,
        totalCount,
      },
    });
  } catch (error) {
    console.error("[ADMIN COMMENTS STATS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comment statistics." },
      { status: 500 }
    );
  }
}
