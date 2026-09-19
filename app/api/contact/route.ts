import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import ContactSubmissionModel from "@/models/ContactSubmission";
import { sendContactNotification } from "@/lib/email/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, name, email, category, subject, message } = body;

    const contactName = (fullName || name || "").trim();
    const contactEmail = (email || "").trim();
    const contactSubject = (subject || "").trim();
    const contactMessage = (message || "").trim();
    const contactCategory = category || "General";

    // Server-side validation
    if (!contactName || contactName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid full name (min 2 characters)." },
        { status: 400 }
      );
    }

    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!contactSubject) {
      return NextResponse.json(
        { success: false, error: "Please provide a subject for your inquiry." },
        { status: 400 }
      );
    }

    if (!contactMessage || contactMessage.length < 15) {
      return NextResponse.json(
        {
          success: false,
          error: "Please write a message with sufficient detail (min 15 characters).",
        },
        { status: 400 }
      );
    }

    // Connect to database
    let savedToDb = false;
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await ContactSubmissionModel.create({
          name: contactName,
          email: contactEmail,
          category: contactCategory,
          subject: contactSubject,
          message: contactMessage,
          read: false,
        });
        savedToDb = true;
      }
    } catch (dbError) {
      console.warn(
        "[CONTACT SUBMISSION DB WARNING] Could not persist to MongoDB:",
        dbError
      );
    }

    // Trigger email notification service
    const mailResult = await sendContactNotification({
      name: contactName,
      email: contactEmail,
      category: contactCategory,
      subject: contactSubject,
      message: contactMessage,
    });

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been received by the IEDC coordination desk.",
      savedToDb,
      mailDelivered: mailResult.delivered,
    });
  } catch (error) {
    console.error("[PUBLIC CONTACT ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to process inquiry. Please try again or reach out directly at iedc@tkiet.ac.in.",
      },
      { status: 500 }
    );
  }
}
