import { createSessionToken, verifyToken, verifyAdminSession } from "../lib/auth/session";
import CertificateBatchModel from "../models/CertificateBatch";
import CertificateRecipientModel from "../models/CertificateRecipient";
import CertificateTemplateModel from "../models/CertificateTemplate";
import CertificateEmailAttemptModel from "../models/CertificateEmailAttempt";
import { generateCertificateId } from "../lib/certificates/pdf-engine";
import { escapeHtml, replacePlaceholders } from "../lib/email/certificate-mailer";
import { sanitizeForCsv } from "../lib/certificates/spreadsheet-parser";

async function runApiE2eTests() {
  console.log("==================================================");
  console.log("STARTING API & SECURITY INTEGRATION VERIFICATION");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, name: string, extra?: any) {
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`, extra || "");
      failed++;
    }
  }

  // 1. Session Token Lifecycle
  console.log("--- 1. Admin Authentication & Session Integrity ---");
  const testEmail = "admin@tkiet.ac.in";
  const token = await createSessionToken(testEmail);
  assert(typeof token === "string" && token.includes("."), "Session token generated with HMAC signature");

  const verified = await verifyToken(token);
  assert(verified !== null && verified.email === testEmail, "Session token successfully verified and decoded", {
    verified,
  });

  const tamperedToken = token + "bad_sig";
  const tamperedResult = await verifyToken(tamperedToken);
  assert(tamperedResult === null, "Tampered session token is rejected");

  // 2. Model compilation checks (avoids Next.js reload crashes)
  console.log("\n--- 2. Mongoose Models Registration Integrity ---");
  assert(!!CertificateBatchModel.modelName, "CertificateBatchModel registered cleanly");
  assert(!!CertificateRecipientModel.modelName, "CertificateRecipientModel registered cleanly");
  assert(!!CertificateTemplateModel.modelName, "CertificateTemplateModel registered cleanly");
  assert(!!CertificateEmailAttemptModel.modelName, "CertificateEmailAttemptModel registered cleanly");

  // 3. Security Sanitization
  console.log("\n--- 3. Security & Anti-Abuse Checks ---");
  const dirtyInput = "<img src=x onerror=alert('xss')>";
  const cleanHtml = escapeHtml(dirtyInput);
  assert(!cleanHtml.includes("<img") && cleanHtml.includes("&lt;img"), "HTML entities properly escaped");

  const csvInjectionAttempt = "@SUM(1+1)*cmd|' /C calc'!A0";
  const safeCsv = sanitizeForCsv(csvInjectionAttempt);
  assert(safeCsv.startsWith("'@"), "Formula injection suppressed with quote escape");

  // 4. Stable Certificate ID
  console.log("\n--- 4. Stable Certificate ID Verification ---");
  const id = generateCertificateId(2026);
  assert(id.startsWith("IEDC-TKIET-2026-"), "Certificate ID prefix verified");
  assert(!id.includes("@"), "Certificate ID never contains personal email or PII");

  console.log("\n==================================================");
  console.log(`INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runApiE2eTests().catch((err) => {
  console.error("Integration Test Failure:", err);
  process.exit(1);
});
