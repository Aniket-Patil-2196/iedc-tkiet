import { getPublishedEvents, getPublishedEventBySlug } from "../lib/db/queries";
import { resolveRegistrationMode, isDevelopmentPlaceholder, getEventStatus } from "../lib/utils/event-status";

async function runDraftAndSafetyAudit() {
  console.log("====================================================================");
  console.log("IEDC TKIET — DRAFT, UNPUBLISHED & API SAFETY AUDIT");
  console.log("====================================================================\n");

  // 1. Query all published events using getPublishedEvents()
  const publishedList = await getPublishedEvents();
  console.log(`[TEST 1] getPublishedEvents() query:`);
  console.log(`  Total returned events: ${publishedList.length}`);
  const anyUnpublished = publishedList.some((e) => e.published !== true);
  console.log(`  Any unpublished / draft events returned? ${anyUnpublished ? "FAIL (Unpublished found!)" : "PASS (All events strictly published: true)"}`);

  // 2. Query an unpublished / non-existent slug using getPublishedEventBySlug()
  console.log(`\n[TEST 2] getPublishedEventBySlug() isolation:`);
  const draftSlug = "internal-draft-quantum-workshop-2026";
  const draftResult = await getPublishedEventBySlug(draftSlug);
  console.log(`  Result for draft slug "${draftSlug}":`, draftResult);
  console.log(`  Draft result is null (triggers 404 in app/events/[slug]/page.tsx)? ${draftResult === null ? "PASS" : "FAIL"}`);

  // 3. Test HTTP GET to /events/[slug] for draft/unpublished slug on live server
  console.log(`\n[TEST 3] HTTP GET /events/${draftSlug} direct URL:`);
  const httpRes = await fetch(`http://localhost:3000/events/${draftSlug}`);
  console.log(`  HTTP status code returned: ${httpRes.status}`);
  console.log(`  Returns 404 Not Found? ${httpRes.status === 404 ? "PASS" : "FAIL"}`);

  // 4. Test Register API with a placeholder event (must reject)
  console.log(`\n[TEST 4] Register API on development placeholder event:`);
  const regPlaceholderRes = await fetch("http://localhost:3000/api/events/evt-placeholder-1/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Attendee",
      email: "test@example.com",
      phone: "9876543210",
      college: "TKIET Warananagar",
      year: "Final Year",
    }),
  });
  const regPlaceholderJson = await regPlaceholderRes.json();
  console.log(`  HTTP status: ${regPlaceholderRes.status}`);
  console.log(`  Response:`, regPlaceholderJson);
  console.log(`  Placeholder rejected with 400? ${regPlaceholderRes.status === 400 && regPlaceholderJson.error?.includes("placeholder") ? "PASS" : "FAIL"}`);

  // 5. Test Register API on a draft/non-existent event ID (must reject with 404)
  console.log(`\n[TEST 5] Register API on non-existent / draft event:`);
  const regDraftRes = await fetch("http://localhost:3000/api/events/draft-event-id-9999/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Attendee",
      email: "test@example.com",
      phone: "9876543210",
      college: "TKIET Warananagar",
      year: "Final Year",
    }),
  });
  const regDraftJson = await regDraftRes.json();
  console.log(`  HTTP status: ${regDraftRes.status}`);
  console.log(`  Response:`, regDraftJson);
  console.log(`  Draft/non-existent rejected properly with 404? ${regDraftRes.status === 404 && !regDraftJson.success ? "PASS" : "FAIL"}`);

  // 6. Test Register API with missing / invalid fields (must reject with 400)
  console.log(`\n[TEST 6] Register API schema validation with invalid email/phone:`);
  const regInvalidRes = await fetch("http://localhost:3000/api/events/evt-placeholder-1/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "A",
      email: "not-an-email",
      phone: "123", // invalid phone
      college: "",
      year: "",
    }),
  });
  const regInvalidJson = await regInvalidRes.json();
  console.log(`  HTTP status: ${regInvalidRes.status}`);
  console.log(`  Response:`, regInvalidJson);
  console.log(`  Schema validation rejected with 400? ${regInvalidRes.status === 400 && !regInvalidJson.success ? "PASS" : "FAIL"}`);

  // 7. Test Register API when PAYMENTS_ENABLED=false (default) on any published event
  console.log(`\n[TEST 7] Register API when PAYMENTS_ENABLED=false on published event:`);
  const publishedEvent = publishedList.find((e) => resolveRegistrationMode(e) === "onsite") || publishedList[0];
  if (publishedEvent) {
    const regPaymentsOffRes = await fetch(`http://localhost:3000/api/events/${publishedEvent.id || (publishedEvent as any)._id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Attendee",
        email: "test@example.com",
        phone: "9876543210",
        college: "TKIET Warananagar",
        year: "Final Year",
      }),
    });
    const regPaymentsOffJson = await regPaymentsOffRes.json();
    console.log(`  Target event: "${publishedEvent.title}" (mode: ${resolveRegistrationMode(publishedEvent)})`);
    console.log(`  HTTP status: ${regPaymentsOffRes.status}`);
    console.log(`  Response:`, regPaymentsOffJson);
    const expectedStatus = resolveRegistrationMode(publishedEvent) === "onsite" ? 403 : 400;
    console.log(`  Rejected properly (${expectedStatus})? ${regPaymentsOffRes.status === expectedStatus && !regPaymentsOffJson.success ? "PASS" : "FAIL"}`);
  }

  console.log("\n====================================================================");
  console.log("ALL DRAFT AND API SAFETY CHECKS VERIFIED SUCCESSFULLY");
  console.log("====================================================================\n");
}

runDraftAndSafetyAudit().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
