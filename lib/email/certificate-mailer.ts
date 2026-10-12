import { Resend } from "resend";
import nodemailer from "nodemailer";

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
 * Sends a single personalized certificate email using Resend (with SMTP fallback).
 */
export async function sendPersonalizedCertificateEmail(
  params: SendCertificateParams
): Promise<SendCertificateResult> {
  const safeFilename = `IEDC_TKIET_Certificate_${params.certificateId.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

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

  console.log(`[CERTIFICATE EMAIL] Preparing to send to ${params.recipientEmail} (${params.certificateId})`);

  // 1. PRIMARY: Resend Integration
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.trim()) {
    try {
      console.log(`[RESEND] Initializing Resend client for ${params.recipientEmail}...`);
      const resend = new Resend(resendApiKey.trim());

      const rawFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";
      const fromAddress = rawFrom.includes("<")
        ? rawFrom
        : `IEDC TKIET <${rawFrom}>`;

      // Check if trying to send to someone else with onboarding@resend.dev
      const isTestDomain = rawFrom.includes("resend.dev");
      const isOwnerEmail = params.recipientEmail.toLowerCase() === "aniketcloud01@gmail.com";

      if (isTestDomain && !isOwnerEmail) {
        console.warn(
          `[RESEND WARNING] Attempting to email ${params.recipientEmail} using test domain ${rawFrom}`
        );
      }

      console.log(`[RESEND] Dispatching email via Resend API from "${fromAddress}" to "${params.recipientEmail}"...`);

      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [params.recipientEmail],
        replyTo: params.replyTo || process.env.CONTACT_RECEIVER_EMAIL || undefined,
        subject,
        text: textBody,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">${htmlBody}</div>`,
        attachments: [
          {
            filename: safeFilename,
            content: params.pdfBuffer,
          },
        ],
      });

      if (error) {
        console.error("[RESEND ERROR RESPONSE]", JSON.stringify(error, null, 2));

        let errorMessage = error.message || String(error);
        if (
          errorMessage.toLowerCase().includes("testing emails to your own email address") ||
          errorMessage.toLowerCase().includes("verify a domain")
        ) {
          errorMessage =
            `Resend test domain (${rawFrom}) can only deliver to the account owner (aniketcloud01@gmail.com). To email participants, please verify a custom domain in Resend and configure EMAIL_FROM in Vercel.`;
        }

        return {
          success: false,
          error: errorMessage,
          errorCategory: "permanent",
        };
      }

      console.log(`[RESEND SUCCESS] Sent certificate email to ${params.recipientEmail}. Message ID: ${data?.id}`);
      return {
        success: true,
        providerMessageId: data?.id,
      };
    } catch (err: any) {
      console.error("[RESEND EXCEPTION]", err);
      return {
        success: false,
        error: err?.message || "Unexpected error dispatching email with Resend",
        errorCategory: "transient",
      };
    }
  }

  // 2. SECONDARY FALLBACK: Traditional SMTP (if SMTP_HOST is explicitly configured)
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      console.log(`[SMTP FALLBACK] Dispatching email via ${smtpHost}...`);
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure: port === 465,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      const sender = process.env.SMTP_FROM || smtpUser;
      const info = await transporter.sendMail({
        from: sender.includes("<") ? sender : `"IEDC TKIET" <${sender}>`,
        to: `"${params.recipientName}" <${params.recipientEmail}>`,
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
    } catch (smtpErr: any) {
      console.error("[SMTP ERROR]", smtpErr);
      return {
        success: false,
        error: smtpErr?.message || "SMTP dispatch error",
        errorCategory: "transient",
      };
    }
  }

  // 3. Neither RESEND_API_KEY nor SMTP configured
  console.warn(
    `[EMAIL CONFIG NOTICE] Neither RESEND_API_KEY nor SMTP credentials found. Cannot send email to ${params.recipientEmail}.`
  );
  return {
    success: false,
    error: "RESEND_API_KEY is not configured in environment variables. Please add RESEND_API_KEY in Vercel project settings.",
    errorCategory: "config",
  };
}
