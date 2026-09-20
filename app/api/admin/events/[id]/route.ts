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

    // Sanitize and strictly validate registration fields
    const updateData: any = { ...body };

    if (body.registrationMode !== undefined && body.registrationMode !== null) {
      if (!["external", "onsite", "none"].includes(body.registrationMode)) {
        return NextResponse.json(
          { success: false, error: "Invalid registration mode. Must be 'external', 'onsite', or 'none'." },
          { status: 400 }
        );
      }
      updateData.registrationMode = body.registrationMode;
    }

    if (body.fee !== undefined && body.fee !== null) {
      const parsedFee = Number(body.fee);
      if (!Number.isInteger(parsedFee) || parsedFee < 0) {
        return NextResponse.json(
          { success: false, error: "Fee must be a non-negative integer (in rupees)." },
          { status: 400 }
        );
      }
      updateData.fee = parsedFee;
    }

    if (body.capacity !== undefined) {
      if (body.capacity === null || body.capacity === "") {
        updateData.capacity = null;
      } else {
        const parsedCap = Number(body.capacity);
        if (!Number.isInteger(parsedCap) || parsedCap < 1) {
          return NextResponse.json(
            { success: false, error: "Capacity must be an integer of at least 1." },
            { status: 400 }
          );
        }
        updateData.capacity = parsedCap;
      }
    }

    if (body.registrationDeadline !== undefined) {
      if (!body.registrationDeadline) {
        updateData.registrationDeadline = null;
      } else {
        let deadlineDate: Date | null = null;
        if (typeof body.registrationDeadline === "string") {
          const istDate = istInputToUtcDate(body.registrationDeadline);
          deadlineDate = istDate || new Date(body.registrationDeadline);
        } else if (body.registrationDeadline instanceof Date) {
          deadlineDate = body.registrationDeadline;
        }

        if (deadlineDate && Number.isNaN(deadlineDate.getTime())) {
          return NextResponse.json(
            { success: false, error: "Invalid registration deadline date format." },
            { status: 400 }
          );
        }
        updateData.registrationDeadline = deadlineDate;
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
