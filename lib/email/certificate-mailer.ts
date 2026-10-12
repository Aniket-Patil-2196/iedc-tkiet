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

export interface SendCertificateEmailParams {
  to: string;
  name: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  filename: string;
}

export interface SendCertificateEmailResult {
  ok: boolean;
  error?: string;
  remaining?: number;
  isQuotaExceeded?: boolean;
}

/**
 * Shared helper that dispatches certificate email via Google Apps Script web app
 */
export async function sendCertificateEmail({
  to,
  name,
  subject,
  html,
  pdfBuffer,
  filename,
}: SendCertificateEmailParams): Promise<SendCertificateEmailResult> {
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  const appsScriptSecret = process.env.APPS_SCRIPT_SECRET;

  if (!appsScriptUrl || !appsScriptUrl.trim()) {
    console.error("[APPS SCRIPT ERROR] APPS_SCRIPT_URL is not configured.");
    return {
      ok: false,
      error: "APPS_SCRIPT_URL is not configured in environment variables.",
    };
  }

  // Keep PDF attachments under 20 MB limit
  if (pdfBuffer.length > 20 * 1024 * 1024) {
    console.error(`[APPS SCRIPT ERROR] PDF exceeds 20MB limit: ${pdfBuffer.length} bytes`);
    return {
      ok: false,
      error: "PDF attachment exceeds the 20 MB size limit.",
    };
  }

  // 25 second timeout per send
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    console.log(`[APPS SCRIPT SEND] Dispatching certificate to ${to} (${filename}, ${pdfBuffer.length} bytes)...`);

    const res = await fetch(appsScriptUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret: appsScriptSecret || "",
        to,
        subject,
        html,
        senderName: "IEDC TKIET",
        filename,
        mimeType: "application/pdf",
        pdfBase64: pdfBuffer.toString("base64"),
      }),
      redirect: "follow",
      signal: controller.signal,
    });

    const responseText = await res.text();
    let data: any = null;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("[APPS SCRIPT NON-JSON RESPONSE]", responseText.slice(0, 500));
      const cleanSnippet = responseText
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 150);
      return {
        ok: false,
        error: `Apps Script returned non-JSON response (HTTP ${res.status}): ${cleanSnippet || "HTML error page"}`,
      };
    }

    if (!res.ok || !data || data.ok !== true) {
      const errorMsg = data?.error || `Apps Script returned failure (HTTP ${res.status})`;
      console.error(`[APPS SCRIPT EMAIL ERROR to ${to}]:`, errorMsg);

      const isQuota = /service invoked too many times|limit exceeded|daily limit|quota/i.test(errorMsg);

      return {
        ok: false,
        error: errorMsg,
        remaining: data?.remaining,
        isQuotaExceeded: isQuota,
      };
    }

    console.log(`[APPS SCRIPT SUCCESS] Certificate email delivered to ${to}. Remaining: ${data.remaining ?? "N/A"}`);
    return {
      ok: true,
      remaining: data.remaining,
    };
  } catch (err: any) {
    if (err.name === "AbortError" || err.message?.includes("aborted")) {
      console.error(`[APPS SCRIPT TIMEOUT] Request to Apps Script timed out after 25s for ${to}`);
      return {
        ok: false,
        error: "Google Apps Script request timed out after 25 seconds.",
      };
    }

    console.error("[APPS SCRIPT FETCH EXCEPTION]", err);
    return {
      ok: false,
      error: err?.message || "Failed to connect to Google Apps Script web app.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
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
}

export interface SendCertificateResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  remaining?: number;
  isQuotaExceeded?: boolean;
}

/**
 * Personalized certificate email adapter using sendCertificateEmail
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
  const htmlBody = replacePlaceholders(
    params.bodyTemplate.replace(/\n/g, "<br/>"),
    variables,
    true
  );
  const html = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">${htmlBody}</div>`;

  const result = await sendCertificateEmail({
    to: params.recipientEmail,
    name: params.recipientName,
    subject,
    html,
    pdfBuffer: params.pdfBuffer,
    filename: safeFilename,
  });

  return {
    success: result.ok,
    error: result.error,
    remaining: result.remaining,
    isQuotaExceeded: result.isQuotaExceeded,
  };
}
