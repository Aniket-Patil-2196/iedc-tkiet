import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import PreviousSpeakerModel from "@/models/PreviousSpeaker";

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
    const updated = await PreviousSpeakerModel.findByIdAndUpdate(
      params.id,
      {
        ...body,
        displayOrder: Number(body.displayOrder) || 0,
        published: Boolean(body.published),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Speaker record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN UPDATE SPEAKER ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update speaker record." },
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

    const deleted = await PreviousSpeakerModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Speaker record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Speaker record deleted." });
  } catch (error) {
    console.error("[ADMIN DELETE SPEAKER ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete speaker record." },
      { status: 500 }
    );
  }
}
