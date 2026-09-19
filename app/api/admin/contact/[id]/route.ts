import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import ContactSubmissionModel from "@/models/ContactSubmission";

interface Params {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const updated = await ContactSubmissionModel.findByIdAndUpdate(
      params.id,
      { read: Boolean(body.read) },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Submission not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN PATCH CONTACT ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update submission status." },
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

    const deleted = await ContactSubmissionModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Submission not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Submission removed." });
  } catch (error) {
    console.error("[ADMIN DELETE CONTACT ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete submission." },
      { status: 500 }
    );
  }
}
