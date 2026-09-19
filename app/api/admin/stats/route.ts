import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import EventModel from "@/models/Event";
import BlogModel from "@/models/Blog";
import TeamMemberModel from "@/models/TeamMember";
import AchievementModel from "@/models/Achievement";
import GalleryImageModel from "@/models/GalleryImage";
import ContactSubmissionModel from "@/models/ContactSubmission";

export async function GET() {
  try {
    const mongooseConn = await connectToDatabase();

    if (!mongooseConn) {
      return NextResponse.json({
        success: true,
        databaseConnected: false,
        stats: {
          eventsCount: 0,
          blogsCount: 0,
          teamCount: 0,
          achievementsCount: 0,
          galleryCount: 0,
          unreadContactsCount: 0,
        },
        recentActivity: {
          latestEvent: null,
          latestBlog: null,
          latestContact: null,
        },
      });
    }

    const [
      eventsCount,
      blogsCount,
      teamCount,
      achievementsCount,
      galleryCount,
      unreadContactsCount,
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
      EventModel.findOne().sort({ createdAt: -1 }).select("title createdAt"),
      BlogModel.findOne({ published: true })
        .sort({ publicationDate: -1 })
        .select("title publicationDate"),
      ContactSubmissionModel.findOne()
        .sort({ createdAt: -1 })
        .select("name subject createdAt"),
    ]);

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
      },
      recentActivity: {
        latestEvent: latestEventDoc?.title || null,
        latestBlog: latestBlogDoc?.title || null,
        latestContact: latestContactDoc
          ? `${latestContactDoc.name} — "${latestContactDoc.subject}"`
          : null,
      },
    });
  } catch (error) {
    console.error("[ADMIN STATS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to compile admin statistics." },
      { status: 500 }
    );
  }
}
