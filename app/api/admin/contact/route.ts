import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import ContactSubmissionModel from "@/models/ContactSubmission";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: [],
        source: "database_disconnected",
      });
    }

    const submissions = await ContactSubmissionModel.find().sort({
      createdAt: -1,
    });
    return NextResponse.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("[ADMIN GET CONTACTS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact submissions." },
      { status: 500 }
    );
  }
}
