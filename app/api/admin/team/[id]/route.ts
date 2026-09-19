import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import TeamMemberModel from "@/models/TeamMember";

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
    const updated = await TeamMemberModel.findByIdAndUpdate(
      params.id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Team member not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN UPDATE TEAM ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update team member." },
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

    const deleted = await TeamMemberModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Team member not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Team member deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE TEAM ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete team member." },
      { status: 500 }
    );
  }
}
