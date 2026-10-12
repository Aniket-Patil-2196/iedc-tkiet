import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import { verifyAdminSession } from "@/lib/auth/session";
import CertificateBatchModel from "@/models/CertificateBatch";
import { renderCertificatePdf, generateCertificateId } from "@/lib/certificates/pdf-engine";
import { getCertificateFile } from "@/lib/storage/certificate-storage";
import { sendPersonalizedCertificateEmail } from "@/lib/email/certificate-mailer";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: Params) {
  console.log(`[TEST EMAIL API START] Received test email request for batch ${params.id}`);

  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      console.warn("[TEST EMAIL API 401] Unauthorized access attempt");
      return NextResponse.json({ success: false, error: "Unauthorized access. Session invalid or expired." }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      console.warn(`[TEST EMAIL API 400] Invalid batch ID: ${params.id}`);
      return NextResponse.json({ success: false, error: "Invalid batch ID format." }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      console.error("[TEST EMAIL API 503] Database connection failed");
      return NextResponse.json(
        { success: false, error: "Database not connected. Please check MONGODB_URI." },
        { status: 503 }
      );
    }

    const batch = await CertificateBatchModel.findById(params.id);
    if (!batch) {
      console.warn(`[TEST EMAIL API 404] Batch ${params.id} not found`);
      return NextResponse.json({ success: false, error: "Certificate batch not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const testEmail = body.testEmail?.trim();
    const sampleName = body.sampleName?.trim() || "John Doe (Test Administrator)";

    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      console.warn(`[TEST EMAIL API 400] Invalid email format: "${testEmail}"`);
      return NextResponse.json(
        { success: false, error: "Please enter a valid recipient email address for testing." },
        { status: 400 }
      );
    }

    console.log(`[TEST EMAIL API] Loading template file: ${batch.templateSnapshot?.fileReference}`);

    // Load template
    const templateFile = await getCertificateFile(
      batch.templateSnapshot.fileReference
    );
    if (!templateFile) {
      console.error("[TEST EMAIL API 404] Certificate template file missing from storage");
      return NextResponse.json(
        {
          success: false,
          error: "Certificate template file not found in storage. Please re-upload your certificate template.",
        },
        { status: 404 }
      );
    }

    const sampleCertId = generateCertificateId(new Date().getFullYear());

    console.log(`[TEST EMAIL API] Rendering sample PDF for ${sampleName} (${sampleCertId})...`);

    // Render sample PDF in memory
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

    console.log(`[TEST EMAIL API] PDF rendered (${samplePdfBuffer.length} bytes). Dispatching test email to ${testEmail}...`);

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
      console.error("[TEST EMAIL API FAILURE]", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to dispatch test email with Resend.",
        },
        { status: 400 }
      );
    }

    console.log(`[TEST EMAIL API SUCCESS] Dispatched to ${testEmail}. Provider ID: ${result.providerMessageId}`);

    return NextResponse.json({
      success: true,
      message: result.isSimulated
        ? `Test email simulated successfully to ${testEmail} (RESEND_API_KEY not configured).`
        : `Test email sent successfully to ${testEmail}. Please check your inbox (and spam folder).`,
      isSimulated: result.isSimulated,
      providerMessageId: result.providerMessageId,
    });
  } catch (error: any) {
    console.error("[TEST EMAIL API UNCAUGHT EXCEPTION]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error occurred while sending test email.",
      },
      { status: 500 }
    );
  }
}
