import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import RegistrationModel from "@/models/Registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status, adminNote } = body || {};

    if (!status || !["pending", "under_review", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status. Must be 'pending', 'under_review', 'approved', or 'rejected'.",
        },
        { status: 400 }
      );
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database unavailable." },
        { status: 503 }
      );
    }

    const registration = await RegistrationModel.findById(id);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found." },
        { status: 404 }
      );
    }

    if (!registration.submission) {
      registration.submission = {
        link: null,
        fileName: null,
        driveFileId: null,
        mimeType: null,
        submittedAt: null,
        status,
        adminNote: adminNote !== undefined ? (adminNote ? String(adminNote).trim() : null) : null,
      };
    } else {
      registration.submission.status = status;
      if (adminNote !== undefined) {
        registration.submission.adminNote = adminNote
          ? String(adminNote).trim()
          : null;
      }
    }

    await registration.save();

    return NextResponse.json({
      success: true,
      message: `Submission status updated to ${status}.`,
      submission: registration.submission,
    });
  } catch (error: any) {
    console.error("[ADMIN PATCH SUBMISSION ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update submission status.",
      },
      { status: 500 }
    );
  }
}
