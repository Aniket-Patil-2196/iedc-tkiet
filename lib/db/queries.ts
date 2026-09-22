import { connectToDatabase } from "@/lib/mongodb/client";
import EventModel from "@/models/Event";
import BlogModel from "@/models/Blog";
import TeamMemberModel from "@/models/TeamMember";
import AboutContentModel from "@/models/AboutContent";
import JourneyModel from "@/models/Journey";
import LeadershipMessageModel from "@/models/LeadershipMessage";
import CollaborationModel from "@/models/Collaboration";
import AchievementModel from "@/models/Achievement";
import GalleryImageModel from "@/models/GalleryImage";
import PreviousSpeakerModel from "@/models/PreviousSpeaker";
import ImpactMetricModel from "@/models/ImpactMetric";
import RegistrationModel from "@/models/Registration";

import {
  PLACEHOLDER_EVENTS,
  PLACEHOLDER_BLOGS,
  PLACEHOLDER_JOURNEY,
  PLACEHOLDER_LEADERSHIP_ROLES,
  PLACEHOLDER_STUDENT_TEAM,
  PLACEHOLDER_FACULTY_TEAM,
  PLACEHOLDER_COLLABORATIONS,
  PLACEHOLDER_ACHIEVEMENTS,
  PLACEHOLDER_GALLERY,
  PLACEHOLDER_SPEAKERS,
  PLACEHOLDER_IMPACT_METRICS,
} from "@/lib/data/placeholders";
import { CANONICAL_JOURNEY_MILESTONES } from "@/lib/data/journeyData";

import {
  IEvent,
  IBlog,
  ITeamMember,
  IAboutContent,
  IJourneyMilestone,
  ILeadershipMessage,
  ICollaboration,
  IAchievement,
  IGalleryImage,
  IPreviousSpeaker,
  IImpactMetric,
} from "@/types/content";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Baseline official institutional About text for TKIET.
 */
const DEFAULT_ABOUT_CONTENT: IAboutContent = {
  whoWeAre:
    "The Innovation and Entrepreneurship Development Cell (IEDC) at Tatyasaheb Kore Institute of Engineering and Technology (TKIET), Warananagar, is an institutional catalyst dedicated to nurturing student innovators, engineering thinkers, and venture creators. We provide an ecosystem bridging academic engineering theory with real-world entrepreneurial execution.",
  vision:
    "To be recognized as a premier regional incubation nucleus that transforms aspiring engineering students into ethical, visionary entrepreneurs and technological trailblazers.",
  mission:
    "To cultivate an entrepreneurial mindset across all engineering disciplines through experiential bootcamps, structured mentorship, laboratory prototyping resources, patent guidance, and pre-incubation grants.",
};

/**
 * Public Events Query: Strictly filters published events.
 */
export async function getPublishedEvents(): Promise<IEvent[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await EventModel.find({ published: true })
        .sort({ startDate: -1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
        })) as IEvent[];
      }
      // If connected but 0 records in DB
      if (isProduction) return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - EVENTS]", err);
  }

  // In production, never display fictional records if DB is unavailable
  if (isProduction) return [];

  // Development preview fallback
  return PLACEHOLDER_EVENTS.filter((e) => e.published);
}

/**
 * Public Events Query: Aggregates paid registration counts across all events in a single DB query.
 */
export async function getPaidRegistrationCounts(): Promise<Record<string, number>> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await RegistrationModel.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: "$eventId", count: { $sum: 1 } } },
      ]);
      const result: Record<string, number> = {};
      if (Array.isArray(docs)) {
        for (const item of docs) {
          if (item._id) {
            result[item._id.toString()] = item.count;
          }
        }
      }
      return result;
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - REGISTRATION COUNTS]", err);
  }
  return {};
}

/**
 * Public Single Event Query by Slug
 */
export async function getPublishedEventBySlug(
  slug: string
): Promise<IEvent | null> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const doc = await EventModel.findOne({ slug, published: true }).lean();
      if (doc) {
        return {
          ...(doc as any),
          id: (doc as any)._id.toString(),
        } as IEvent;
      }
      if (isProduction) return null;
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - EVENT BY SLUG]", err);
  }

  if (isProduction) return null;

  const placeholder = PLACEHOLDER_EVENTS.find(
    (e) => e.slug === slug && e.published
  );
  return placeholder || null;
}

/**
 * Public Blogs Query: Strictly filters published articles. Fixed author "IEDC TKIET".
 */
export async function getPublishedBlogs(): Promise<IBlog[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await BlogModel.find({ published: true })
        .sort({ publicationDate: -1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
          author: d.author || "IEDC TKIET",
        })) as IBlog[];
      }
      if (isProduction) return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - BLOGS]", err);
  }

  if (isProduction) return [];

  return PLACEHOLDER_BLOGS.filter((b) => b.published);
}

/**
 * Public Single Blog Query by Slug
 */
export async function getPublishedBlogBySlug(
  slug: string
): Promise<IBlog | null> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const doc = await BlogModel.findOne({ slug, published: true }).lean();
      if (doc) {
        return {
          ...(doc as any),
          id: (doc as any)._id.toString(),
          author: (doc as any).author || "IEDC TKIET",
        } as IBlog;
      }
      if (isProduction) return null;
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - BLOG BY SLUG]", err);
  }

  if (isProduction) return null;

  const placeholder = PLACEHOLDER_BLOGS.find(
    (b) => b.slug === slug && b.published
  );
  return placeholder || null;
}

/**
 * Public About Content Query
 */
export async function getAboutContent(): Promise<IAboutContent> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const doc = await AboutContentModel.findOne().lean();
      if (doc) {
        return {
          whoWeAre: (doc as any).whoWeAre || DEFAULT_ABOUT_CONTENT.whoWeAre,
          vision: (doc as any).vision || DEFAULT_ABOUT_CONTENT.vision,
          mission: (doc as any).mission || DEFAULT_ABOUT_CONTENT.mission,
        };
      }
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - ABOUT]", err);
  }

  return DEFAULT_ABOUT_CONTENT;
}

/**
 * Public Team Members Query: Returns active members ordered by position
 */
export async function getPublishedTeamMembers(): Promise<ITeamMember[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await TeamMemberModel.find({ published: { $ne: false } })
        .sort({ order: 1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
        })) as ITeamMember[];
      }
      return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - TEAM]", err);
  }

  // Clean failure mode: return clean empty array on DB disconnect / 0 records (no fake placeholders)
  return [];
}

/**
 * Public Journey Milestones Query: Chronological evolution road
 */
export async function getJourneyMilestones(): Promise<IJourneyMilestone[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await JourneyModel.find({ published: { $ne: false } })
        .sort({ order: 1, year: 1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
        })) as IJourneyMilestone[];
      }
      if (isProduction) return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - JOURNEY]", err);
  }

  if (isProduction) return [];

  return CANONICAL_JOURNEY_MILESTONES;
}

/**
 * Public Leadership Messages Query: Exactly 5 leadership messages
 */
export async function getLeadershipMessages(): Promise<ILeadershipMessage[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await LeadershipMessageModel.find({ published: { $ne: false } })
        .sort({ order: 1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
        })) as ILeadershipMessage[];
      }
      if (isProduction) return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - LEADERSHIP]", err);
  }

  if (isProduction) return [];

  // Development preview fallback
  return PLACEHOLDER_LEADERSHIP_ROLES.map((r, idx) => ({
    id: r.id,
    leaderName: r.positionTitle,
    designation: r.designation,
    institution: r.institution,
    message: r.fullMessage,
    order: idx + 1,
  }));
}

/**
 * Public Collaborations Query
 */
export async function getPublishedCollaborations(): Promise<ICollaboration[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await CollaborationModel.find({ published: { $ne: false } })
        .sort({ order: 1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
        })) as ICollaboration[];
      }
      if (isProduction) return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - COLLABORATIONS]", err);
  }

  if (isProduction) return [];

  return PLACEHOLDER_COLLABORATIONS;
}

/**
 * Public Achievements Query
 */
export async function getPublishedAchievements(): Promise<IAchievement[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await AchievementModel.find({ published: { $ne: false } })
        .sort({ order: 1, year: -1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
        })) as IAchievement[];
      }
      if (isProduction) return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - ACHIEVEMENTS]", err);
  }

  if (isProduction) return [];

  return PLACEHOLDER_ACHIEVEMENTS;
}

/**
 * Public Gallery Query: Strictly filters visible/published photos for 3D Globe
 */
export async function getPublishedGalleryImages(): Promise<IGalleryImage[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      // Clean up legacy broken HTML pin records
      GalleryImageModel.deleteMany({
        imageUrl: { $regex: /pinterest\.com\/pin/i },
      }).catch(() => {});

      const docs = await GalleryImageModel.find({
        published: { $ne: false },
        imageUrl: { $not: /pinterest\.com\/pin/i },
      })
        .sort({ order: 1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
        })) as IGalleryImage[];
      }
      if (isProduction) return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - GALLERY]", err);
  }

  if (isProduction) return [];

  return PLACEHOLDER_GALLERY;
}

/**
 * Public Previous Speakers Query: Strictly filters published speakers.
 */
export async function getPublishedPreviousSpeakers(): Promise<IPreviousSpeaker[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await PreviousSpeakerModel.find({ published: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
        })) as IPreviousSpeaker[];
      }
      if (isProduction) return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - PREVIOUS SPEAKERS]", err);
  }

  // Production must never display development placeholder speakers
  if (isProduction) return [];

  // Development preview fallback
  return PLACEHOLDER_SPEAKERS.filter((s) => s.published);
}

/**
 * Public Impact Metrics Query:
 * Returns ordered active impact metrics from DB, or development reference placeholders.
 */
export async function getImpactMetrics(): Promise<IImpactMetric[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await ImpactMetricModel.find({ enabled: true })
        .sort({ displayOrder: 1, createdAt: 1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
        })) as IImpactMetric[];
      }
      if (isProduction) return [];
    }
  } catch (err) {
    console.warn("[DB QUERY WARNING - IMPACT METRICS]", err);
  }

  // In production, never display unverified numbers as official facts
  if (isProduction) return [];

  // Development preview fallback (clearly structured initial metrics)
  return PLACEHOLDER_IMPACT_METRICS.filter((m) => m.enabled);
}

