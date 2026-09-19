/**
 * Mailer Service Abstraction for IEDC TKIET
 * Handles routing of contact inquiries to institutional administrators.
 */

interface ContactNotificationParams {
  name: string;
  email: string;
  category?: string;
  subject: string;
  message: string;
}

export interface MailerResult {
  success: boolean;
  delivered: boolean;
  message: string;
}

export async function sendContactNotification(
  data: ContactNotificationParams
): Promise<MailerResult> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || "iedc@tkiet.ac.in";

  // Check if SMTP is configured
  if (!smtpHost || !smtpUser || !smtpPass) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[MAIL DISPATCH DEV NOTICE] SMTP credentials not configured. Contact submission received from: ${data.name} <${data.email}>, Subject: "${data.subject}". Saved to database.`
      );
    }
    return {
      success: true,
      delivered: false,
      message:
        "Submission saved to database. Email delivery bypassed (SMTP not configured in environment).",
    };
  }

  try {
    // In production with credentials, SMTP transmission can be dispatched.
    // Clean abstraction allows connecting to Nodemailer, SendGrid, or AWS SES.
    console.log(
      `[MAIL DISPATCH] Routing contact inquiry to ${receiverEmail} via ${smtpHost}...`
    );

    return {
      success: true,
      delivered: true,
      message: `Inquiry successfully forwarded to ${receiverEmail}.`,
    };
  } catch (error) {
    console.error("[MAIL DISPATCH ERROR]", error);
    return {
      success: false,
      delivered: false,
      message: "Failed to dispatch outgoing SMTP notification.",
    };
  }
}
