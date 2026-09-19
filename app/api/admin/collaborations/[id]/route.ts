import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import CollaborationModel from "@/models/Collaboration";

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
    const updated = await CollaborationModel.findByIdAndUpdate(
      params.id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Collaboration not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN UPDATE COLLABORATION ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update collaboration." },
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

    const deleted = await CollaborationModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Collaboration not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Collaboration deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE COLLABORATION ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete collaboration." },
      { status: 500 }
    );
  }
}
