import nodemailer from "nodemailer";
import { ICertificateRecipient } from "@/types/certificate";

/**
 * Escapes HTML characters in placeholders
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Replaces placeholders like {{participantName}}, {{eventName}}, {{certificateId}}
 */
export function replacePlaceholders(
  template: string,
  variables: Record<string, string>,
  isHtml = false
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = variables[key] ?? "";
    return isHtml ? escapeHtml(val) : val;
  });
}

/**
 * Creates nodemailer transport using environment variables.
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
    // Useful for institutional SMTP servers with specific certs
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

export interface SendCertificateParams {
  recipientEmail: string;
  recipientName: string;
  certificateId: string;
  eventName: string;
  certificateType?: string;
  subjectTemplate: string;
  bodyTemplate: string;
  pdfBuffer: Buffer;
  replyTo?: string;
}

export interface SendCertificateResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  errorCategory?: "transient" | "permanent" | "config";
  isSimulated?: boolean;
}

/**
 * Sends a single personalized certificate email with attachment.
 */
export async function sendPersonalizedCertificateEmail(
  params: SendCertificateParams
): Promise<SendCertificateResult> {
  const transporter = getMailTransporter();
  const senderAddress =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "no-reply@tkiet.ac.in";

  const variables: Record<string, string> = {
    participantName: params.recipientName,
    eventName: params.eventName,
    certificateId: params.certificateId,
    certificateType: params.certificateType || "Participation",
  };

  const subject = replacePlaceholders(params.subjectTemplate, variables, false);
  const textBody = replacePlaceholders(params.bodyTemplate, variables, false);
  const htmlBody = replacePlaceholders(
    params.bodyTemplate.replace(/\n/g, "<br/>"),
    variables,
    true
  );

  const safeFilename = `IEDC_TKIET_Certificate_${params.certificateId.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

  // If SMTP is not configured in dev/test environment
  if (!transporter) {
    console.warn(
      `[CERTIFICATE EMAIL SIMULATION] SMTP not configured. Simulated send to ${params.recipientEmail} (${params.certificateId})`
    );
    return {
      success: true,
      providerMessageId: `simulated-${Date.now()}-${params.certificateId}`,
      isSimulated: true,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"IEDC TKIET" <${senderAddress}>`,
      to: `"${params.recipientName}" <${params.recipientEmail}>`,
      replyTo: params.replyTo || process.env.CONTACT_RECEIVER_EMAIL || senderAddress,
      subject,
      text: textBody,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">${htmlBody}</div>`,
      attachments: [
        {
          filename: safeFilename,
          content: params.pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return {
      success: true,
      providerMessageId: info.messageId,
    };
  } catch (err: any) {
    console.error("[SMTP TRANSMISSION ERROR]", err);
    const message = err.message || "Failed to send email";
    const isPermanent =
      /invalid recipient|recipient rejected|mailbox unavailable|user not found|550|551|553/i.test(
        message
      );

    return {
      success: false,
      error: message,
      errorCategory: isPermanent ? "permanent" : "transient",
    };
  }
}
