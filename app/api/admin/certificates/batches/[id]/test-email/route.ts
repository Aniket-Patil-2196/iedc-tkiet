import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateBatchModel from "@/models/CertificateBatch";
import { renderCertificatePdf, generateCertificateId } from "@/lib/certificates/pdf-engine";
import { getCertificateFile } from "@/lib/storage/certificate-storage";
import { sendPersonalizedCertificateEmail } from "@/lib/email/certificate-mailer";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ success: false, error: "Invalid batch ID" }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const batch = await CertificateBatchModel.findById(params.id);
    if (!batch) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    const body = await request.json();
    const testEmail = body.testEmail?.trim();
    const sampleName = body.sampleName?.trim() || "John Doe (Test Administrator)";

    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      return NextResponse.json(
        { success: false, error: "A valid recipient email address is required for the test email." },
        { status: 400 }
      );
    }

    // Load template
    const templateFile = await getCertificateFile(
      batch.templateSnapshot.fileReference
    );
    if (!templateFile) {
      return NextResponse.json(
        { success: false, error: "Certificate template file not found in storage." },
        { status: 404 }
      );
    }

    const sampleCertId = generateCertificateId(new Date().getFullYear());

    // Render sample PDF
    const samplePdfBuffer = await renderCertificatePdf(
      templateFile.buffer,
      batch.templateSnapshot,
      {
        participantName: sampleName,
        certificateId: sampleCertId,
        eventName: batch.eventName,
        eventDate: batch.eventDate,
        certificateType: batch.certificateType,
        issueDate: new Date().toLocaleDateString("en-IN"),
      }
    );

    // Send test email
    const result = await sendPersonalizedCertificateEmail({
      recipientEmail: testEmail,
      recipientName: sampleName,
      certificateId: sampleCertId,
      eventName: batch.eventName,
      certificateType: batch.certificateType,
      subjectTemplate: `[TEST] ${batch.emailSubject}`,
      bodyTemplate: `[THIS IS A TEST CERTIFICATE EMAIL PREVIEW]\n\n${batch.emailBody}`,
      pdfBuffer: samplePdfBuffer,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to dispatch test email",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.isSimulated
        ? `Test email simulated successfully to ${testEmail} (SMTP not configured in environment).`
        : `Test email sent successfully to ${testEmail}. Please check your inbox.`,
      isSimulated: result.isSimulated,
      providerMessageId: result.providerMessageId,
    });
  } catch (error: any) {
    console.error("[TEST EMAIL ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}
