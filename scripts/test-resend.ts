import { Resend } from "resend";
import { renderCertificatePdf, generateCertificateId } from "../lib/certificates/pdf-engine";
import { PDFDocument } from "pdf-lib";
import { ITemplateSnapshot } from "../types/certificate";

async function main() {
  const apiKey = process.argv[2] || process.env.RESEND_API_KEY;
  const recipientEmail = process.argv[3] || "aniketcloud01@gmail.com";

  if (!apiKey) {
    console.log("Usage: npx tsx scripts/test-resend.ts <YOUR_RESEND_API_KEY> [recipientEmail]");
    console.log("Or add RESEND_API_KEY to your .env.local file and run: npx tsx scripts/test-resend.ts");
    process.exit(1);
  }

  console.log(`[RESEND TEST] Testing email dispatch to: ${recipientEmail}...`);

  const resend = new Resend(apiKey.trim());

  // Create a minimal test PDF in memory
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([842, 595]);
  const templateBytes = await pdfDoc.save();
  const templateBuffer = Buffer.from(templateBytes);

  const templateSnapshot: ITemplateSnapshot = {
    fileReference: "test-ref",
    fileName: "template.pdf",
    mimeType: "application/pdf",
    pageWidth: 842,
    pageHeight: 595,
    orientation: "landscape",
    fields: [
      {
        id: "name",
        fieldKey: "participantName",
        label: "Participant Name",
        x: 50,
        y: 50,
        fontSize: 28,
        fontFamily: "HelveticaBold",
        color: "#1e3a8a",
        alignment: "center",
      },
    ],
  };

  const sampleCertId = generateCertificateId(2026);
  const samplePdf = await renderCertificatePdf(templateBuffer, templateSnapshot, {
    participantName: "Aniket Patil",
    certificateId: sampleCertId,
    eventName: "IEDC TKIET Verification Event",
  });

  const fromAddress = process.env.EMAIL_FROM || "IEDC TKIET <onboarding@resend.dev>";
  console.log(`[RESEND TEST] Sending email from: "${fromAddress}"...`);

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: [recipientEmail],
    subject: `[TEST CERTIFICATE] Your IEDC TKIET Verification Certificate`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>IEDC TKIET Certificate System Verification</h2>
        <p>Dear Aniket,</p>
        <p>This is a test certificate dispatch to confirm that your Resend integration and API key are functioning properly.</p>
        <p><strong>Certificate ID:</strong> ${sampleCertId}</p>
        <p>The personalized certificate PDF is attached to this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">Innovation and Entrepreneurship Development Cell (IEDC), TKIET Warananagar</p>
      </div>
    `,
    attachments: [
      {
        filename: `IEDC_TKIET_Certificate_${sampleCertId}.pdf`,
        content: samplePdf,
      },
    ],
  });

  if (error) {
    console.error("\n❌ [RESEND ERROR]");
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log("\n✅ [RESEND SUCCESS]");
  console.log(`Message successfully dispatched! Resend Email ID: ${data?.id}`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
