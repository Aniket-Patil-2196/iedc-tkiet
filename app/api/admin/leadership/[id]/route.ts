import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import LeadershipMessageModel from "@/models/LeadershipMessage";

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
    const updated = await LeadershipMessageModel.findByIdAndUpdate(
      params.id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Leadership message not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN UPDATE LEADERSHIP ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update leadership message." },
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

    const deleted = await LeadershipMessageModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Leadership message not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Leadership message deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE LEADERSHIP ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete leadership message." },
      { status: 500 }
    );
  }
}
