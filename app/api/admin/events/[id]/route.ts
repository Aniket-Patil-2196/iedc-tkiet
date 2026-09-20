import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import EventModel from "@/models/Event";
import { istInputToUtcDate } from "@/lib/utils/date-ist";

interface Params {
  params: { id: string };
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Sanitize registration fields
    const updateData: any = { ...body };
    if (body.fee !== undefined) {
      updateData.fee = typeof body.fee === "number" ? Math.max(0, Math.floor(body.fee)) : Math.max(0, parseInt(body.fee, 10) || 0);
    }
    if (body.capacity !== undefined) {
      updateData.capacity = body.capacity ? Math.max(1, parseInt(body.capacity, 10) || 0) : null;
    }
    if (body.registrationDeadline !== undefined) {
      if (!body.registrationDeadline) {
        updateData.registrationDeadline = null;
      } else if (typeof body.registrationDeadline === "string") {
        const istDate = istInputToUtcDate(body.registrationDeadline);
        updateData.registrationDeadline = istDate || new Date(body.registrationDeadline);
      } else if (body.registrationDeadline instanceof Date) {
        updateData.registrationDeadline = body.registrationDeadline;
      }
    }
    if (body.registrationOpen !== undefined) {
      updateData.registrationOpen = Boolean(body.registrationOpen);
    }

    const updated = await EventModel.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN UPDATE EVENT ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update event." },
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

    const deleted = await EventModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Event deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE EVENT ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event." },
      { status: 500 }
    );
  }
}
