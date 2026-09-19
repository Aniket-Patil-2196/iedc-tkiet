import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import JourneyModel from "@/models/Journey";

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
    const updated = await JourneyModel.findByIdAndUpdate(
      params.id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Milestone not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN UPDATE JOURNEY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update milestone." },
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

    const deleted = await JourneyModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Milestone not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Milestone deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE JOURNEY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete milestone." },
      { status: 500 }
    );
  }
}
