import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CommentModel from "@/models/Comment";
import { verifyAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const [totalCount, rootCount, replyCount, reportedCount] =
      await Promise.all([
        CommentModel.countDocuments(),
        CommentModel.countDocuments({ parentId: null }),
        CommentModel.countDocuments({ parentId: { $ne: null } }),
        CommentModel.countDocuments({ reportsCount: { $gt: 0 } }),
      ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalCount,
        rootCount,
        replyCount,
        reportedCount,
        pendingCount: 0,
        approvedCount: totalCount,
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
