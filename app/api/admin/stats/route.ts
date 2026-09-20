import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import EventModel from "@/models/Event";
import BlogModel from "@/models/Blog";
import TeamMemberModel from "@/models/TeamMember";
import AchievementModel from "@/models/Achievement";
import GalleryImageModel from "@/models/GalleryImage";
import ContactSubmissionModel from "@/models/ContactSubmission";
import CommentModel from "@/models/Comment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const mongooseConn = await connectToDatabase();

    if (!mongooseConn) {
      console.warn("[ADMIN STATS] Database unreachable during stats fetch");
      return NextResponse.json(
        {
          success: false,
          databaseConnected: false,
          error: "Database unreachable. Could not connect to MongoDB cluster.",
        },
        { status: 503 }
      );
    }

    const [
      eventsCount,
      blogsCount,
      teamCount,
      achievementsCount,
      galleryCount,
      unreadContactsCount,
      pendingCommentsCount,
      totalCommentsCount,
      latestEventDoc,
      latestBlogDoc,
      latestContactDoc,
    ] = await Promise.all([
      EventModel.countDocuments(),
      BlogModel.countDocuments({ published: true }),
      TeamMemberModel.countDocuments(),
      AchievementModel.countDocuments(),
      GalleryImageModel.countDocuments(),
      ContactSubmissionModel.countDocuments({ read: false }),
      CommentModel.countDocuments({ status: "pending" }),
      CommentModel.countDocuments(),
      EventModel.findOne().sort({ createdAt: -1 }).select("title createdAt"),
      BlogModel.findOne({ published: true })
        .sort({ publicationDate: -1 })
        .select("title publicationDate"),
      ContactSubmissionModel.findOne()
        .sort({ createdAt: -1 })
        .select("name subject createdAt"),
    ]);

    console.log("[ADMIN STATS COMPILED]", {
      eventsCount,
      blogsCount,
      teamCount,
      achievementsCount,
      galleryCount,
      unreadContactsCount,
      pendingCommentsCount,
      totalCommentsCount,
    });

    return NextResponse.json({
      success: true,
      databaseConnected: true,
      stats: {
        eventsCount,
        blogsCount,
        teamCount,
        achievementsCount,
        galleryCount,
        unreadContactsCount,
        pendingCommentsCount,
        totalCommentsCount,
      },
      recentActivity: {
        latestEvent: latestEventDoc?.title || null,
        latestBlog: latestBlogDoc?.title || null,
        latestContact: latestContactDoc
          ? `${latestContactDoc.name} — "${latestContactDoc.subject}"`
          : null,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN STATS ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to compile admin statistics." },
      { status: 500 }
    );
  }
}
