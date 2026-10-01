import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CommentModel from "@/models/Comment";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
    id: string;
  };
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const { slug, id } = params;

    const comment = await CommentModel.findOneAndUpdate(
      { _id: id, blogSlug: slug },
      { $inc: { reportsCount: 1 } },
      { new: true }
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you. This remark has been flagged for editorial review.",
    });
  } catch (error) {
    console.error("[COMMENT REPORT ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to report comment." },
      { status: 500 }
    );
  }
}
