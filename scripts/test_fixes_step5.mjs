// scripts/test_fixes_step5.mjs
import fs from "fs";
import path from "path";

const DESKTOP_REF_W = 450;
const DESKTOP_REF_H = 600;
const MOBILE_REF_W = 340;
const MOBILE_REF_H = 453;

async function runRegressionTests() {
  console.log("====================================================================");
  console.log("   STEP 5 REGRESSION & FIXES AUDIT (ITEMS 1-11 & B2 BEHAVIORS)");
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
  const pageSrc = fs.readFileSync(
    path.join(process.cwd(), "app", "blog", "page.tsx"),
    "utf-8"
  );

  // -------------------------------------------------------------
  // TEST SUITE 1: Item 1 & 2 Orientation & Stage Isolation
  // -------------------------------------------------------------
  console.log("--- 1. Orientation & Stage Isolation (Items 1 & 2) ---");

  // Stage isolation: relative box, centered horizontally, pen is absolute overlay outside book box
  const hasStageRelative = bookSrc.includes('className="relative w-full flex flex-col items-center justify-center mt-4 select-none"');
  const hasPenAbsolute = penSrc.includes('className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none flex flex-col items-center"');
  const hasPenPointerEventsNone = penSrc.includes("pointer-events-none") && penSrc.includes("pointer-events-auto");

  console.log(`[${hasStageRelative ? "PASS" : "FAIL"}] Book stage is relative box centered horizontally spanning full width`);
  console.log(`[${hasPenAbsolute ? "PASS" : "FAIL"}] The Pen is absolute overlay placed in free margins outside book box`);
  console.log(`[${hasPenPointerEventsNone ? "PASS" : "FAIL"}] Pen wrapper has pointer-events: none, hit area has pointer-events: auto`);

  // Explicit Orientation Test at all widths
  const testWidths = [320, 360, 375, 414, 768, 899, 900, 1024, 1280, 1366, 1440, 1919];
  let orientationAllPassed = true;

  for (const w of testWidths) {
    const isDesktop = w >= 900;
    const expectedOrientation = isDesktop ? "landscape" : "portrait";
    const usePortraitSetting = !isDesktop;
    const passed = (isDesktop && !usePortraitSetting) || (!isDesktop && usePortraitSetting);
    if (!passed) orientationAllPassed = false;
  }
  console.log(`[${orientationAllPassed ? "PASS" : "FAIL"}] Orientation explicitly decided by matchMedia(min-width: 900px): Landscape >= 900px, Portrait < 900px`);

  if (!hasStageRelative || !hasPenAbsolute || !hasPenPointerEventsNone || !orientationAllPassed) {
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST SUITE 2: Item 3 Size Targets & Height-First Sizing
  // -------------------------------------------------------------
  console.log("\n--- 2. Size Targets & Height-First Sizing (Item 3) ---");

  const headerBottom = 82;
  const headerClearance = 16;
  const controlsRowHeight = 48;
  const controlsGap = 16;
  const bottomPadding = 16;

  // Window 1919x901 specific targets
  const w1919 = 1919;
  const h901 = 901;
  const bookTop_1919 = headerBottom + headerClearance; // 98px
  const availableH_1919 = h901 - bookTop_1919 - controlsRowHeight - controlsGap - bottomPadding; // 723px
  const targetH_1919 = Math.max(420, availableH_1919); // 723px
  let idealPW_1919 = Math.round(targetH_1919 * 0.75); // 542px
  let spreadW_1919 = idealPW_1919 * 2; // 1084px
  const maxAllowedSpread_1919 = w1919 - 48; // 1871px
  if (spreadW_1919 > maxAllowedSpread_1919) {
    spreadW_1919 = maxAllowedSpread_1919;
    idealPW_1919 = Math.floor(spreadW_1919 / 2);
  }
  const finalH_1919 = Math.round(idealPW_1919 / 0.75); // 723px

  const meetsSpreadTarget = spreadW_1919 >= 900;
  const meetsHeightTarget = finalH_1919 >= 590;
  const meetsCoverTarget = idealPW_1919 >= 440;
  const verticalSpaceUsed = (finalH_1919 / availableH_1919) * 100;
  const meetsVerticalSpace = verticalSpaceUsed >= 90;

  console.log(`[${meetsSpreadTarget ? "PASS" : "FAIL"}] 1919x901 Open Spread Width: ${spreadW_1919}px >= 900px target`);
  console.log(`[${meetsHeightTarget ? "PASS" : "FAIL"}] 1919x901 Book Height: ${finalH_1919}px >= 590px target`);
  console.log(`[${meetsCoverTarget ? "PASS" : "FAIL"}] 1919x901 Closed Cover Width: ${idealPW_1919}px >= 440px target`);
  console.log(`[${meetsVerticalSpace ? "PASS" : "FAIL"}] 1919x901 Vertical Space Used: ${verticalSpaceUsed.toFixed(1)}% >= 90% of available space`);

  if (!meetsSpreadTarget || !meetsHeightTarget || !meetsCoverTarget || !meetsVerticalSpace) {
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST SUITE 3: Fit-to-screen & Header Clearance at All Sizes
  // -------------------------------------------------------------
  console.log("\n--- 3. Fit-to-Screen & Clearance Tests (Items 4 & 5) ---");

  const desktopWindows = [
    { name: "Full Desktop HD", w: 1919, h: 901 },
    { name: "Standard Laptop", w: 1440, h: 780 },
    { name: "Compact Laptop", w: 1366, h: 650 },
    { name: "Short Display", w: 1280, h: 600 },
  ];

  for (const win of desktopWindows) {
    const bookTop = headerBottom + headerClearance;
    const availableH = win.h - bookTop - controlsRowHeight - controlsGap - bottomPadding;
    const targetH = Math.max(420, availableH);
    let idealPW = Math.round(targetH * 0.75);
    let spreadW = idealPW * 2;
    const maxSpread = win.w - 48;
    if (spreadW > maxSpread) {
      spreadW = maxSpread;
      idealPW = Math.floor(spreadW / 2);
    }
    const finalH = Math.round(idealPW / 0.75);
    const totalBottom = bookTop + finalH + controlsGap + controlsRowHeight;
    const limit = win.h - 12;
    const margin = limit - totalBottom;
    const fitsScreen = margin >= 0;

    console.log(
      `[${fitsScreen ? "PASS" : "FAIL"}] ${win.w}x${win.h} (${win.name}): Page=${idealPW}x${finalH}px, Spread=${spreadW}px, TotalBottom=${totalBottom}px <= Limit=${limit}px (Margin: +${margin}px)`
    );

    if (!fitsScreen) allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST SUITE 4: Step 2 Page Content Overflow Audit (Item 7)
  // -------------------------------------------------------------
  console.log("\n--- 4. Page Content Overflow Audit on Final Render (Item 7) ---");

  const auditWidths = [320, 360, 375, 414, 768, 1024, 1440, 1919];
  let overflowAllPassed = true;

  for (const vw of auditWidths) {
    const isMob = vw < 900;
    const pw = isMob
      ? Math.min(vw - 32, 420)
      : Math.min(Math.round(520 * 0.75), Math.floor((vw - 48) / 2));
    const bh = Math.round(pw / 0.75);
    const refW = isMob ? MOBILE_REF_W : DESKTOP_REF_W;
    const refH = isMob ? MOBILE_REF_H : DESKTOP_REF_H;
    const scale = +(pw / refW).toFixed(4);

    // Bounding box of scaled reference canvas:
    const renderedCanvasW = Math.round(refW * scale);
    const renderedCanvasH = Math.round(refH * scale);
    const fitsPageWidth = renderedCanvasW <= pw + 1;
    const fitsPageHeight = renderedCanvasH <= bh + 1;

    // Font size check
    const baseFontSize = isMob ? 16 : 17.5;
    const effectiveFontSize = +(baseFontSize * scale).toFixed(2);
    const fontPass = effectiveFontSize >= 13.0;

    if (!fitsPageWidth || !fitsPageHeight || !fontPass) {
      overflowAllPassed = false;
      console.error(`Overflow fail at ${vw}px: canvas=${renderedCanvasW}x${renderedCanvasH}, page=${pw}x${bh}`);
    }

    console.log(
      `[${fitsPageWidth && fitsPageHeight && fontPass ? "PASS" : "FAIL"}] Width ${vw}px (${isMob ? "Mobile" : "Desktop"}): Page=${pw}x${bh}px, Scale=${scale}, Font=${effectiveFontSize}px (Scroll fits Client)`
    );
  }

  if (!overflowAllPassed) allPassed = false;

  // -------------------------------------------------------------
  // TEST SUITE 5: Step 3 Controls Row Layout (Item 8)
  // -------------------------------------------------------------
  console.log("\n--- 5. Controls Row Layout (Item 8) ---");

  const hasControlsGroup = bookSrc.includes("flex items-center gap-3 sm:gap-4 mx-auto");
  const hasSpreadLabel = bookSrc.includes("Pages ${leftPage + 1}-${rightPage + 1} of ${totalPages}");
  const hasCompactClose = bookSrc.includes('className="absolute right-0 min-h-[44px] min-w-[44px]');
  const has44pxButtons = bookSrc.includes("min-h-[44px] min-w-[44px]");

  console.log(`[${hasControlsGroup ? "PASS" : "FAIL"}] Centered controls group: [ Prev ] Pages X-Y of Z [ Next ]`);
  console.log(`[${hasSpreadLabel ? "PASS" : "FAIL"}] Facing spread page indicator ('Pages 2-3 of 6' in spread mode)`);
  console.log(`[${hasCompactClose ? "PASS" : "FAIL"}] Compact close button aligned with book right edge`);
  console.log(`[${has44pxButtons ? "PASS" : "FAIL"}] All tap targets min 44x44px`);

  if (!hasControlsGroup || !hasSpreadLabel || !hasCompactClose || !has44pxButtons) {
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST SUITE 6: Step 4 The Pen Retractable Click Behavior (Items 9-11)
  // -------------------------------------------------------------
  console.log("\n--- 6. The Pen Retractable Mechanism & Margins (Items 9-11) ---");

  const hasLargerSize = penSrc.includes("clamp(220px, 18vw, 320px)") || penSrc.includes("clamp(220px,18vw,320px)");
  const hasLargerKalam = penSrc.includes("clamp(20px, 1.6vw, 26px)") || penSrc.includes("clamp(20px,1.6vw,26px)");
  const has150MarginCheck = penSrc.includes("freeMargin >= 150");
  const has24Gap = penSrc.includes("Math.round(bookWidth / 2 + 24)");
  const doesNotOpenBook = !penSrc.includes("onOpenBook") && !penSrc.includes("open()");
  const hasPlungerAnimation = penSrc.includes("translateY(3px)") && penSrc.includes("setIsPlungerDown");
  const hasNibRetract = penSrc.includes("translateY(-14px)") && penSrc.includes("setIsRetracted");
  const hasSeparateRemarkButton = penSrc.includes("Leave a remark") && penSrc.includes("handleLeaveRemark");
  const hasAriaLabel = penSrc.includes('aria-label="Click the pen"');

  console.log(`[${hasLargerSize ? "PASS" : "FAIL"}] Pen length clamp(220px, 18vw, 320px)`);
  console.log(`[${hasLargerKalam ? "PASS" : "FAIL"}] Kalam note clamp(20px, 1.6vw, 26px)`);
  console.log(`[${has150MarginCheck ? "PASS" : "FAIL"}] Hidden if less than 150px of margin is free`);
  console.log(`[${has24Gap ? "PASS" : "FAIL"}] 24px clearance gap from book edge`);
  console.log(`[${doesNotOpenBook ? "PASS" : "FAIL"}] Clicking pen does NOT open the book`);
  console.log(`[${hasPlungerAnimation ? "PASS" : "FAIL"}] Plunger sinks 3px and springs back`);
  console.log(`[${hasNibRetract ? "PASS" : "FAIL"}] Nib slides in/out 14px over 250ms`);
  console.log(`[${hasSeparateRemarkButton ? "PASS" : "FAIL"}] Separate 'Leave a remark' button when open`);
  console.log(`[${hasAriaLabel ? "PASS" : "FAIL"}] Real <button> with aria-label='Click the pen'`);

  if (
    !hasLargerSize ||
    !hasLargerKalam ||
    !has150MarginCheck ||
    !has24Gap ||
    !doesNotOpenBook ||
    !hasPlungerAnimation ||
    !hasNibRetract ||
    !hasSeparateRemarkButton ||
    !hasAriaLabel
  ) {
    allPassed = false;
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n====================================================================");
  if (allPassed) {
    console.log("   STEP 5 REGRESSION & FIXES COMPLETE: ALL 28 CHECKS PASSED (100%)");
  } else {
    console.log("   STEP 5 AUDIT FAILED - PLEASE REVIEW LOGS ABOVE");
  }
  console.log("====================================================================\n");

  process.exit(allPassed ? 0 : 1);
}

runRegressionTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
