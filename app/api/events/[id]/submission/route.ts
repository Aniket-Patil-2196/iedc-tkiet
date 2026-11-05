import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import EventModel from "@/models/Event";
import RegistrationModel from "@/models/Registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

function isValidGoogleDriveHost(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "drive.google.com" ||
      host === "docs.google.com" ||
      host.endsWith(".drive.google.com") ||
      host.endsWith(".docs.google.com")
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { receiptToken, link } = body || {};

    if (!receiptToken || typeof receiptToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid receipt token is required." },
        { status: 400 }
      );
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database connection unavailable." },
        { status: 503 }
      );
    }

    // 1. Fetch Event
    const event = await EventModel.findById(id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    // 2. Verify event is online
    if (!event.isOnline) {
      return NextResponse.json(
        {
          success: false,
          error: "Participant submissions are only available for online events.",
        },
        { status: 400 }
      );
    }

    // 3. Verify submission is enabled
    if (!event.submission?.enabled) {
      return NextResponse.json(
        {
          success: false,
          error: "Participant submission is not enabled for this event.",
        },
        { status: 400 }
      );
    }

    // Determine submission link
    let effectiveLink = (link && typeof link === "string" ? link.trim() : "");
    if (!effectiveLink && event.submission.mode === "folder" && event.submission.folderUrl) {
      effectiveLink = event.submission.folderUrl.trim();
    }

    if (!effectiveLink) {
      return NextResponse.json(
        { success: false, error: "Submission link is required." },
        { status: 400 }
      );
    }

    if (!isValidGoogleDriveHost(effectiveLink)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid link host. Link must be from drive.google.com or docs.google.com.",
        },
        { status: 400 }
      );
    }

    // 4. Verify submission deadline has not passed
    if (event.submission.deadline) {
      const deadlineDate = new Date(event.submission.deadline);
      if (new Date() > deadlineDate) {
        return NextResponse.json(
          {
            success: false,
            error: "The submission deadline for this event has passed.",
          },
          { status: 400 }
        );
      }
    }

    // 5. Verify registration exists, belongs to requester, matches event, and is paid
    const registration = await RegistrationModel.findOne({
      receiptToken: receiptToken.trim(),
      eventId: event._id,
    });

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration not found or does not belong to this event.",
        },
        { status: 404 }
      );
    }

    const isEligible =
      registration.status === "paid" ||
      registration.status === "verification_required" ||
      registration.status === "pending" ||
      registration.paymentMethod === "MANUAL_UPI" ||
      registration.paymentMode === "manual_upi";

    if (!isEligible) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Submissions are only permitted for active or recorded registrations.",
        },
        { status: 403 }
      );
    }

    // 6. Save submission & set status 'pending' (allows resubmission until deadline)
    registration.submission = {
      link: effectiveLink,
      fileName: registration.submission?.fileName || null,
      driveFileId: registration.submission?.driveFileId || null,
      mimeType: registration.submission?.mimeType || null,
      submittedAt: new Date(),
      status: "pending",
      adminNote: null,
    };

    await registration.save();

    return NextResponse.json({
      success: true,
      message: "Submission received successfully and is pending review.",
      submission: registration.submission,
    });
  } catch (error: any) {
    console.error("[SUBMISSION POST ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error processing submission.",
      },
      { status: 500 }
    );
  }
}
