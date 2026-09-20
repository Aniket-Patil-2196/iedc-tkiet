import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import EventModel from "@/models/Event";
import { istInputToUtcDate } from "@/lib/utils/date-ist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: [],
        source: "no-connection",
      });
    }

    const events = await EventModel.find().sort({ startDate: -1, createdAt: -1 });
    return NextResponse.json({
      success: true,
      data: events,
      source: "database",
    });
  } catch (error) {
    console.error("[ADMIN GET EVENTS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not connected. Please configure MONGODB_URI.",
        },
        { status: 503 }
      );
    }

    // Required fields validation
    if (!body.title || !body.description || !body.startDate || !body.venue) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, description, event date, and venue are required.",
        },
        { status: 400 }
      );
    }

    // Validate registration URL if present
    if (body.registrationUrl && typeof body.registrationUrl === "string") {
      const trimmedUrl = body.registrationUrl.trim();
      if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
        return NextResponse.json(
          { success: false, error: "Registration link must be a valid web URL starting with http:// or https://" },
          { status: 400 }
        );
      }
    }

    // Generate normalized slug
    const rawSlug = body.slug || body.title;
    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Validate and sanitize registration fields
    const fee = typeof body.fee === "number" ? Math.max(0, Math.floor(body.fee)) : Math.max(0, parseInt(body.fee, 10) || 0);
    const capacity = body.capacity ? Math.max(1, parseInt(body.capacity, 10) || 0) : null;
    let registrationDeadline: Date | null = null;
    if (body.registrationDeadline) {
      if (typeof body.registrationDeadline === "string") {
        const istDate = istInputToUtcDate(body.registrationDeadline);
        registrationDeadline = istDate || new Date(body.registrationDeadline);
      } else if (body.registrationDeadline instanceof Date) {
        registrationDeadline = body.registrationDeadline;
      }
    }
    const registrationOpen = body.registrationOpen !== undefined ? Boolean(body.registrationOpen) : true;

    const newEvent = await EventModel.create({
      ...body,
      slug,
      fee,
      capacity,
      registrationDeadline,
      registrationOpen,
      category: body.category || "Workshop",
      published: Boolean(body.published),
    });

    return NextResponse.json({ success: true, data: newEvent });
  } catch (error: unknown) {
    console.error("[ADMIN CREATE EVENT ERROR]", error);
    const err = error as { code?: number; message?: string };
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: "An event with this slug already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create event." },
      { status: 500 }
    );
  }
}
