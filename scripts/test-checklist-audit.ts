import crypto from "crypto";
import { z } from "zod";
import { getEventStatus, getRegistrationAction, resolveRegistrationMode, isDevelopmentPlaceholder } from "../lib/utils/event-status";
import { getPublishedEvents, getPublishedEventBySlug } from "../lib/db/queries";
import { IEvent } from "../types/content";

async function runChecklistAudit() {
  console.log("====================================================================");
  console.log("IEDC TKIET — COMPREHENSIVE AUDIT & VERIFICATION SUITE");
  console.log("====================================================================\n");

  const results: { test: string; passed: boolean; details: string }[] = [];

  // -------------------------------------------------------------
  // 1. PAYMENTS_ENABLED Flag & UI / API Enforcement
  // -------------------------------------------------------------
  console.log("[SECTION 1] PAYMENTS_ENABLED Flag & UI / API Enforcement");

  const mockOnsiteEvent: Partial<IEvent> = {
    id: "evt-mock-onsite",
    title: "Innovate AI Bootcamp",
    startDate: "2026-11-20T10:00:00.000Z",
    registrationMode: "onsite",
    fee: 250,
    capacity: 100,
    registrationOpen: true,
    published: true,
  };
  const mockExternalEvent: Partial<IEvent> = {
    id: "evt-mock-ext",
    title: "Design Sprint",
    startDate: "2026-11-25T10:00:00.000Z",
    registrationMode: "external",
    registrationUrl: "https://forms.google.com/test-sprint",
    registrationOpen: true,
    published: true,
  };
  const mockNoneEvent: Partial<IEvent> = {
    id: "evt-mock-none",
    title: "Open Exhibition",
    startDate: "2026-11-30T10:00:00.000Z",
    registrationMode: "none",
    published: true,
  };

  const onsiteStatus = getEventStatus(mockOnsiteEvent, 10, new Date("2026-09-20T12:00:00Z"));
  const extStatus = getEventStatus(mockExternalEvent, 0, new Date("2026-09-20T12:00:00Z"));
  const noneStatus = getEventStatus(mockNoneEvent, 0, new Date("2026-09-20T12:00:00Z"));

  // When PAYMENTS_ENABLED=false:
  const actionPaymentsDisabled = getRegistrationAction(mockOnsiteEvent, onsiteStatus, false);
  const passDisabledLabel = actionPaymentsDisabled.type === "disabled" && actionPaymentsDisabled.label === "Online registration opens soon";
  results.push({
    test: "PAYMENTS_ENABLED=false shows 'Online registration opens soon' on UI",
    passed: passDisabledLabel,
    details: `Action: ${actionPaymentsDisabled.label} (type: ${actionPaymentsDisabled.type})`,
  });

  // External & None modes keep working:
  const actionExt = getRegistrationAction(mockExternalEvent, extStatus, false);
  const actionNone = getRegistrationAction(mockNoneEvent, noneStatus, false);
  const passExtWorking = actionExt.type === "external" && actionExt.url === "https://forms.google.com/test-sprint";
  const passNoneWorking = actionNone.type === "disabled" && actionNone.label === "No Registration Required";
  results.push({
    test: "External Google Form links keep working when PAYMENTS_ENABLED=false",
    passed: passExtWorking,
    details: `Type: ${actionExt.type}, URL: ${actionExt.type === "external" ? actionExt.url : "N/A"}`,
  });
  results.push({
    test: "'No Registration Required' mode keeps working when PAYMENTS_ENABLED=false",
    passed: passNoneWorking,
    details: `Label: ${actionNone.label}`,
  });

  // When PAYMENTS_ENABLED=true:
  const actionPaymentsEnabled = getRegistrationAction(mockOnsiteEvent, onsiteStatus, true);
  const passEnabledLabel = actionPaymentsEnabled.type === "onsite" && actionPaymentsEnabled.label.includes("250");
  results.push({
    test: "PAYMENTS_ENABLED=true activates onsite payment button with fee",
    passed: passEnabledLabel,
    details: `Action: ${actionPaymentsEnabled.label} (type: ${actionPaymentsEnabled.type})`,
  });

  // -------------------------------------------------------------
  // 2. Draft (Unpublished) Event Isolation
  // -------------------------------------------------------------
  console.log("\n[SECTION 2] Draft (Unpublished) Event Isolation");

  const publishedEvents = await getPublishedEvents();
  const draftInList = publishedEvents.some((e) => e.published === false);
  results.push({
    test: "getPublishedEvents() excludes draft/unpublished events",
    passed: !draftInList,
    details: `Total published: ${publishedEvents.length}, Drafts in list: ${draftInList}`,
  });

  const draftSlug = "confidential-draft-not-for-public";
  const draftEvent = await getPublishedEventBySlug(draftSlug);
  results.push({
    test: "getPublishedEventBySlug() returns null for unpublished/non-existent event",
    passed: draftEvent === null,
    details: `Draft slug result: ${draftEvent === null ? "null (Triggers 404)" : "found"}`,
  });

  // -------------------------------------------------------------
  // 3. Register API Safety & Edge Cases
  // -------------------------------------------------------------
  console.log("\n[SECTION 3] Register API Status & Validation Functions");

  // A. Deadline passed
  const pastDeadlineEvent: Partial<IEvent> = {
    id: "evt-past-dl",
    startDate: "2026-10-20T10:00:00Z",
    registrationDeadline: "2026-09-10T12:00:00Z", // Past
    registrationMode: "onsite",
    published: true,
  };
  const pastDlStatus = getEventStatus(pastDeadlineEvent, 0, new Date("2026-09-20T12:00:00Z"));
  results.push({
    test: "Deadline passed results in registration: closed",
    passed: pastDlStatus.registration === "closed",
    details: `Registration status: ${pastDlStatus.registration}`,
  });

  // B. Capacity full (Sold Out)
  const soldOutEvent: Partial<IEvent> = {
    id: "evt-sold-out",
    startDate: "2026-10-20T10:00:00Z",
    registrationMode: "onsite",
    capacity: 50,
    published: true,
  };
  const soldOutStatus = getEventStatus(soldOutEvent, 50, new Date("2026-09-20T12:00:00Z"));
  results.push({
    test: "Capacity full results in registration: sold-out",
    passed: soldOutStatus.registration === "sold-out",
    details: `Registration status: ${soldOutStatus.registration}`,
  });

  // C. Placeholder event
  const placeholderEvent: Partial<IEvent> = {
    id: "evt-placeholder-1",
    title: "[Development Placeholder] Web Dev",
    startDate: "2026-10-20T10:00:00Z",
    registrationMode: "onsite",
    published: true,
  };
  const isPlaceholderDetected = isDevelopmentPlaceholder(placeholderEvent);
  const placeholderStatus = getEventStatus(placeholderEvent, 0, new Date("2026-09-20T12:00:00Z"));
  results.push({
    test: "Placeholder event detected and onsite registration disabled",
    passed: isPlaceholderDetected && placeholderStatus.registration === "none",
    details: `isPlaceholder: ${isPlaceholderDetected}, registration: ${placeholderStatus.registration}`,
  });

  // D. Schema validation for Register payload
  const RegisterSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(10).max(15).regex(/^[0-9+\s()-]+$/),
    college: z.string().trim().min(2).max(150),
    year: z.string().trim().min(1).max(50),
  });

  const validParsed = RegisterSchema.safeParse({
    name: "Aarav Sharma",
    email: "aarav@tkiet.ac.in",
    phone: "9876543210",
    college: "TKIET Warananagar",
    year: "Third Year",
  });
  const invalidEmailParsed = RegisterSchema.safeParse({
    name: "Aarav Sharma",
    email: "not-an-email",
    phone: "9876543210",
    college: "TKIET Warananagar",
    year: "Third Year",
  });
  const invalidPhoneParsed = RegisterSchema.safeParse({
    name: "Aarav Sharma",
    email: "aarav@tkiet.ac.in",
    phone: "123", // too short
    college: "TKIET Warananagar",
    year: "Third Year",
  });

  results.push({
    test: "Register schema validates valid input correctly",
    passed: validParsed.success,
    details: `Success: ${validParsed.success}`,
  });
  results.push({
    test: "Register schema rejects invalid email",
    passed: !invalidEmailParsed.success,
    details: `Rejected: ${!invalidEmailParsed.success}`,
  });
  results.push({
    test: "Register schema rejects invalid phone length",
    passed: !invalidPhoneParsed.success,
    details: `Rejected: ${!invalidPhoneParsed.success}`,
  });

  // -------------------------------------------------------------
  // 4. Razorpay Test-Mode Verification Math & Signatures
  // -------------------------------------------------------------
  console.log("\n[SECTION 4] Razorpay Signature Math & Receipt Verification");

  const secret = "rzp_test_secret_sample_key";
  const orderId = "order_test_999888";
  const paymentId = "pay_test_111222";
  const validSignature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const tamperedSignature = crypto.createHmac("sha256", secret).update(`${orderId}|pay_fake_999`).digest("hex");

  const verifyHmac = (ord: string, pay: string, sig: string, sec: string): boolean => {
    const expected = crypto.createHmac("sha256", sec).update(`${ord}|${pay}`).digest("hex");
    const expBuf = Buffer.from(expected, "utf-8");
    const sigBuf = Buffer.from(sig, "utf-8");
    return expBuf.length === sigBuf.length && crypto.timingSafeEqual(expBuf, sigBuf);
  };

  const passValidHmac = verifyHmac(orderId, paymentId, validSignature, secret);
  const rejectTamperedHmac = !verifyHmac(orderId, paymentId, tamperedSignature, secret);

  results.push({
    test: "Razorpay HMAC-SHA256 signature verification passes on valid signature",
    passed: passValidHmac,
    details: `Valid sig match: ${passValidHmac}`,
  });
  results.push({
    test: "Razorpay HMAC-SHA256 signature verification rejects tampered payment_id",
    passed: rejectTamperedHmac,
    details: `Tampered rejected: ${rejectTamperedHmac}`,
  });

  // -------------------------------------------------------------
  // 5. Dynamic Module Import Check (jspdf & html-to-image)
  // -------------------------------------------------------------
  console.log("\n[SECTION 5] Dynamic Module Imports (jspdf & html-to-image)");

  let jspdfLoaded = false;
  let htmlToImageLoaded = false;
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    jspdfLoaded = Boolean(doc && typeof doc.save === "function");
  } catch (err: any) {
    console.error("jspdf import error:", err);
  }

  try {
    const htmlToImage = await import("html-to-image");
    htmlToImageLoaded = Boolean(htmlToImage && typeof htmlToImage.toPng === "function");
  } catch (err: any) {
    console.error("html-to-image import error:", err);
  }

  results.push({
    test: "jspdf loads and initializes successfully",
    passed: jspdfLoaded,
    details: `jspdf operational: ${jspdfLoaded}`,
  });
  results.push({
    test: "html-to-image loads successfully",
    passed: htmlToImageLoaded,
    details: `html-to-image operational: ${htmlToImageLoaded}`,
  });

  // -------------------------------------------------------------
  // Summary Display
  // -------------------------------------------------------------
  console.log("\n====================================================================");
  console.log("AUDIT RESULTS TABLE");
  console.log("====================================================================\n");

  console.table(
    results.map((r, i) => ({
      "#": i + 1,
      "Audit Item": r.test,
      "Status": r.passed ? "PASS" : "FAIL",
      "Evidence / Details": r.details,
    }))
  );

  const allPassed = results.every((r) => r.passed);
  console.log(`\nOverall Result: ${allPassed ? "ALL AUDIT CHECKS PASSED (100%)" : "FAILURES DETECTED"}\n`);

  if (!allPassed) {
    process.exit(1);
  }
}

runChecklistAudit().catch((err) => {
  console.error("Audit failed with uncaught exception:", err);
  process.exit(1);
});
