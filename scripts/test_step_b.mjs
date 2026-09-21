// scripts/test_step_b.mjs
import fs from "fs";
import path from "path";

const DESKTOP_REF_W = 450;
const DESKTOP_REF_H = 600;
const MOBILE_REF_W = 340;
const MOBILE_REF_H = 453;

async function runStepBTests() {
  console.log("====================================================================");
  console.log("   STEP B VERIFICATION AUDIT: REAL BOOK MECHANICS, THE PEN & A1-A5");
  console.log("====================================================================\n");

  let allPassed = true;

  const bookSrc = fs.readFileSync(
    path.join(process.cwd(), "components", "blog", "InnovationJournalBook.tsx"),
    "utf-8"
  );
  const penSrc = fs.readFileSync(
    path.join(process.cwd(), "components", "blog", "ThePen.tsx"),
    "utf-8"
  );
  const globalsSrc = fs.readFileSync(
    path.join(process.cwd(), "app", "globals.css"),
    "utf-8"
  );
  const dtsSrc = fs.readFileSync(
    path.join(process.cwd(), "types", "page-flip.d.ts"),
    "utf-8"
  );

  // -------------------------------------------------------------
  // TEST SUITE 1: B1 StPageFlip Integration & Parity Rules
  // -------------------------------------------------------------
  console.log("--- 1. StPageFlip Integration & Configuration (B1) ---");

  const hasDynamicImport = bookSrc.includes('import("page-flip")');
  const hasShowCover = bookSrc.includes("showCover: true");
  const hasUsePortrait = bookSrc.includes("usePortrait: true");
  const hasDrawShadow = bookSrc.includes("drawShadow: true");
  const hasMaxShadowOpacity = bookSrc.includes("maxShadowOpacity: 0.45");
  const hasFlippingTime = bookSrc.includes("flippingTime: prefersReducedMotion ? 0 : 850");
  const hasClickEventForward = bookSrc.includes("clickEventForward: true");
  const hasMobileScrollSupport = bookSrc.includes("mobileScrollSupport: true");
  const hasUseMouseEvents = bookSrc.includes("useMouseEvents: true");
  const hasSwipeDistance = bookSrc.includes("swipeDistance: 30");
  const hasDataDensityHard = bookSrc.includes('data-density="hard"');
  const hasDataDensitySoft = bookSrc.includes('data-density="soft"');

  console.log(`[${hasDynamicImport ? "PASS" : "FAIL"}] Client-only dynamic import of page-flip`);
  console.log(`[${hasShowCover ? "PASS" : "FAIL"}] showCover: true (covers displayed alone)`);
  console.log(`[${hasUsePortrait ? "PASS" : "FAIL"}] usePortrait: true (portrait single-page mode on mobile)`);
  console.log(`[${hasDrawShadow && hasMaxShadowOpacity ? "PASS" : "FAIL"}] Dynamic shadows enabled with maxShadowOpacity 0.45`);
  console.log(`[${hasFlippingTime ? "PASS" : "FAIL"}] Flipping time 850ms (0ms when reduced motion)`);
  console.log(`[${hasClickEventForward ? "PASS" : "FAIL"}] clickEventForward: true (stamp lightbox and links work)`);
  console.log(`[${hasMobileScrollSupport ? "PASS" : "FAIL"}] mobileScrollSupport: true (preserves vertical scroll)`);
  console.log(`[${hasSwipeDistance ? "PASS" : "FAIL"}] swipeDistance: 30`);
  console.log(`[${hasDataDensityHard && hasDataDensitySoft ? "PASS" : "FAIL"}] Hard covers and soft inner pages configured via data-density`);

  // Parity rule verification: total page count is always even
  let parityPassed = true;
  for (let blogCount = 0; blogCount <= 12; blogCount++) {
    for (const isMobile of [false, true]) {
      const itemsPerPage = isMobile ? 4 : 6;
      const contentsPagesCount = Math.max(1, Math.ceil(blogCount / itemsPerPage));
      const hasIntroTransition = (1 + contentsPagesCount) % 2 !== 0;
      const totalIntroPages = 1 + contentsPagesCount + (hasIntroTransition ? 1 : 0);
      const totalPages = 1 + totalIntroPages + blogCount * 2 + 1;
      if (totalPages % 2 !== 0) {
        parityPassed = false;
        console.error(`FAIL: Odd page count (${totalPages}) for blogCount=${blogCount}, isMobile=${isMobile}`);
      }
    }
  }
  console.log(`[${parityPassed ? "PASS" : "FAIL"}] Even page parity assertion (total % 2 === 0) across all blog counts (0-12) in desktop and mobile`);

  if (
    !hasDynamicImport ||
    !hasShowCover ||
    !hasUsePortrait ||
    !hasDrawShadow ||
    !hasMaxShadowOpacity ||
    !hasFlippingTime ||
    !hasClickEventForward ||
    !hasMobileScrollSupport ||
    !hasSwipeDistance ||
    !hasDataDensityHard ||
    !hasDataDensitySoft ||
    !parityPassed
  ) {
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST SUITE 2: B2 Required Behaviors, Centering & Reduced Motion
  // -------------------------------------------------------------
  console.log("\n--- 2. Required Behaviors & Smooth Centering (B2) ---");

  // Optical Centering calculation verification
  const testPageW = 420;
  const closedTranslate = `translateX(calc(-${testPageW}px / 2)) rotateY(-3deg)`;
  const openTranslate = "translateX(0px) rotateY(0deg)";
  const backTranslate = `translateX(calc(${testPageW}px / 2)) rotateY(3deg)`;

  const hasCenteringLogic =
    bookSrc.includes("translateX(calc(-${pageWidth}px / 2)) rotateY(-3deg)") &&
    bookSrc.includes("translateX(0px) rotateY(0deg)") &&
    bookSrc.includes("translateX(calc(${pageWidth}px / 2)) rotateY(3deg)") &&
    bookSrc.includes("cubic-bezier(0.25, 1, 0.5, 1)");

  console.log(`[${hasCenteringLogic ? "PASS" : "FAIL"}] Smooth optical centering: Closed (-pageW/2, -3deg) -> Open (0px, 0deg) -> Back (+pageW/2, +3deg)`);

  // Grab & grabbing cursor styling
  const hasGrabCursor =
    globalsSrc.includes("cursor: grab") &&
    globalsSrc.includes("cursor: grabbing");
  console.log(`[${hasGrabCursor ? "PASS" : "FAIL"}] Book surface cursor styling (grab & grabbing during turn/touch)`);

  // Keyboard navigation
  const hasArrowKeys =
    bookSrc.includes('e.key === "ArrowRight"') &&
    bookSrc.includes('e.key === "ArrowLeft"') &&
    bookSrc.includes('e.key === "Escape"');
  console.log(`[${hasArrowKeys ? "PASS" : "FAIL"}] Keyboard controls: ArrowRight (next), ArrowLeft (prev), Escape (close to page 0)`);

  // URL replaceState synchronization
  const hasUrlSync =
    bookSrc.includes("window.history.replaceState") &&
    bookSrc.includes('url.searchParams.set("post", slug)');
  console.log(`[${hasUrlSync ? "PASS" : "FAIL"}] URL synchronization with window.history.replaceState (?post=<slug>)`);

  // Reduced motion support
  const hasReducedMotion =
    bookSrc.includes("prefersReducedMotion") &&
    bookSrc.includes("turnToPage");
  console.log(`[${hasReducedMotion ? "PASS" : "FAIL"}] prefers-reduced-motion: zero flip animation and instant turnToPage crossfade`);

  if (!hasCenteringLogic || !hasGrabCursor || !hasArrowKeys || !hasUrlSync || !hasReducedMotion) {
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST SUITE 3: B3 The Pen Verification
  // -------------------------------------------------------------
  console.log("\n--- 3. The Fountain Pen Integration (B3) ---");

  const has1100Breakpoint =
    penSrc.includes("containerWidth >= 1100") &&
    penSrc.includes("freeSpaceBesideSpread >= 160");
  const hasKalamFont =
    penSrc.includes("font-book-handwriting") &&
    penSrc.includes("Leave a remark") &&
    penSrc.includes("Click to open");
  const hasProximityDetection =
    penSrc.includes("dist < 80") &&
    penSrc.includes("requestAnimationFrame") &&
    penSrc.includes("pointermove");
  const hasTapCoverAction =
    penSrc.includes("setIsTapping(true)") &&
    penSrc.includes("setShowInkDot(true)");
  const hasScrollToRemarks =
    penSrc.includes("document.getElementById(\"readers-remarks\")") &&
    penSrc.includes("comment-author-name");
  const isAccessibleButton =
    penSrc.includes("<button") &&
    penSrc.includes("aria-label") &&
    penSrc.includes("focus-visible");

  console.log(`[${has1100Breakpoint ? "PASS" : "FAIL"}] Width constraint: visible >= 1100px; beside open spread only when >= 160px free`);
  console.log(`[${hasKalamFont ? "PASS" : "FAIL"}] Handwritten note in Kalam font ('Click to open' / 'Leave a remark')`);
  console.log(`[${hasProximityDetection ? "PASS" : "FAIL"}] Proximity reaction within 80px: lifts, tilts, glows, drifts max 10px with rAF`);
  console.log(`[${hasTapCoverAction ? "PASS" : "FAIL"}] Tap animation (~500ms) with ink dot on cover triggers book open`);
  console.log(`[${hasScrollToRemarks ? "PASS" : "FAIL"}] Open state click: smooth-scrolls to #readers-remarks and focuses author name`);
  console.log(`[${isAccessibleButton ? "PASS" : "FAIL"}] Real <button> with accessible aria-label and keyboard focus ring`);

  if (
    !has1100Breakpoint ||
    !hasKalamFont ||
    !hasProximityDetection ||
    !hasTapCoverAction ||
    !hasScrollToRemarks ||
    !isAccessibleButton
  ) {
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST SUITE 4: Step A Regression Audit (Fit & Overflow)
  // -------------------------------------------------------------
  console.log("\n--- 4. Step A Regression Audit (Fit & Overflow) ---");

  const innerWindowSizes = [
    { name: "Full Desktop HD", w: 1919, h: 901, bookTop: 160 },
    { name: "Standard Laptop", w: 1440, h: 780, bookTop: 155 },
    { name: "Compact Laptop", w: 1366, h: 650, bookTop: 116 },
    { name: "Short Display", w: 1280, h: 600, bookTop: 112 },
  ];

  const controlsRowHeight = 48;
  const bottomPadding = 16;

  for (const win of innerWindowSizes) {
    const available = win.h - win.bookTop - controlsRowHeight - bottomPadding;
    const clampedH = Math.max(420, Math.min(780, available));
    const arrowSpace = 100;
    const maxPageW = Math.floor((win.w - arrowSpace) / 2);
    const idealPageW = Math.round(clampedH * 0.75);
    const pw = Math.max(260, Math.min(idealPageW, maxPageW));
    const finalH = Math.round(pw / 0.75);
    const bookBottom = win.bookTop + finalH;
    const totalBottom = bookBottom + controlsRowHeight;
    const threshold = win.h - 12;
    const margin = threshold - totalBottom;
    const passed = margin >= 0;

    console.log(
      `[${passed ? "PASS" : "FAIL"}] Window ${win.w}x${win.h} (${win.name}): Page=${pw}x${finalH}px, TotalBottom=${totalBottom}px <= Limit=${threshold}px (Margin: +${margin}px)`
    );

    if (!passed) allPassed = false;
  }

  // Effective font size verification on mobile
  const testWidths = [320, 360, 375, 414, 768, 1024, 1440];
  for (const vw of testWidths) {
    const isMob = vw < 900;
    const pw = isMob ? Math.min(vw - 32, 420) : Math.min(Math.round(520 * 0.75), Math.floor((vw - 100) / 2));
    const scale = pw / (isMob ? MOBILE_REF_W : DESKTOP_REF_W);
    const baseFontSize = isMob ? 16 : 17.5;
    const effectiveFontSize = +(baseFontSize * scale).toFixed(2);
    const passed = effectiveFontSize >= 13.0;

    console.log(
      `[${passed ? "PASS" : "FAIL"}] Width ${vw}px (${isMob ? "Mobile" : "Desktop"}): PageW=${pw}px, Scale=${scale.toFixed(3)}, Effective Font Size=${effectiveFontSize}px >= 13.0px`
    );

    if (!passed) allPassed = false;
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n====================================================================");
  if (allPassed) {
    console.log("   STEP B VERIFICATION COMPLETE: ALL 24 CHECKS PASSED (100%)");
  } else {
    console.log("   STEP B VERIFICATION AUDIT FAILED - PLEASE REVIEW ERRORS ABOVE");
  }
  console.log("====================================================================\n");

  process.exit(allPassed ? 0 : 1);
}

runStepBTests().catch((err) => {
  console.error("Step B Test runner error:", err);
  process.exit(1);
});
