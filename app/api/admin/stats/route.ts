import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import EventModel from "@/models/Event";
import BlogModel from "@/models/Blog";
import TeamMemberModel from "@/models/TeamMember";
import AchievementModel from "@/models/Achievement";
import GalleryImageModel from "@/models/GalleryImage";
import ContactSubmissionModel from "@/models/ContactSubmission";
import {
  PLACEHOLDER_EVENTS,
  PLACEHOLDER_BLOGS,
  PLACEHOLDER_STUDENT_TEAM,
  PLACEHOLDER_FACULTY_TEAM,
  PLACEHOLDER_ACHIEVEMENTS,
  PLACEHOLDER_GALLERY,
} from "@/lib/data/placeholders";

export async function GET() {
  try {
    const mongooseConn = await connectToDatabase();

    if (!mongooseConn) {
      // Return counts from placeholder records if DB is not configured
      return NextResponse.json({
        success: true,
        databaseConnected: false,
        stats: {
          eventsCount: PLACEHOLDER_EVENTS.length,
          blogsCount: PLACEHOLDER_BLOGS.filter((b) => b.published).length,
          teamCount:
            PLACEHOLDER_STUDENT_TEAM.length + PLACEHOLDER_FACULTY_TEAM.length,
          achievementsCount: PLACEHOLDER_ACHIEVEMENTS.length,
          galleryCount: PLACEHOLDER_GALLERY.length,
          unreadContactsCount: 0,
        },
        recentActivity: {
          latestEvent: PLACEHOLDER_EVENTS[0]?.title || null,
          latestBlog: PLACEHOLDER_BLOGS[0]?.title || null,
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
