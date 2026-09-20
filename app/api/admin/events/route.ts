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

    // Validate registrationMode
    let registrationMode = body.registrationMode;
    if (registrationMode !== undefined && registrationMode !== null) {
      if (!["external", "onsite", "none"].includes(registrationMode)) {
        return NextResponse.json(
          { success: false, error: "Invalid registration mode. Must be 'external', 'onsite', or 'none'." },
          { status: 400 }
        );
      }
    } else {
      registrationMode = body.registrationUrl?.trim() ? "external" : "none";
    }

    // Validate fee: integer >= 0
    let fee = 0;
    if (body.fee !== undefined && body.fee !== null) {
      const parsedFee = Number(body.fee);
      if (!Number.isInteger(parsedFee) || parsedFee < 0) {
        return NextResponse.json(
          { success: false, error: "Fee must be a non-negative integer (in rupees)." },
          { status: 400 }
        );
      }
      fee = parsedFee;
    }

    // Validate capacity: integer >= 1 or null
    let capacity: number | null = null;
    if (body.capacity !== undefined && body.capacity !== null && body.capacity !== "") {
      const parsedCap = Number(body.capacity);
      if (!Number.isInteger(parsedCap) || parsedCap < 1) {
        return NextResponse.json(
          { success: false, error: "Capacity must be an integer of at least 1." },
          { status: 400 }
        );
      }
      capacity = parsedCap;
    }

    // Validate deadline
    let registrationDeadline: Date | null = null;
    if (body.registrationDeadline) {
      if (typeof body.registrationDeadline === "string") {
        const istDate = istInputToUtcDate(body.registrationDeadline);
        registrationDeadline = istDate || new Date(body.registrationDeadline);
      } else if (body.registrationDeadline instanceof Date) {
        registrationDeadline = body.registrationDeadline;
      }
      if (registrationDeadline && Number.isNaN(registrationDeadline.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid registration deadline date format." },
          { status: 400 }
        );
      }
    }
    const registrationOpen = body.registrationOpen !== undefined ? Boolean(body.registrationOpen) : true;

    const newEvent = await EventModel.create({
      ...body,
      slug,
      registrationMode,
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
