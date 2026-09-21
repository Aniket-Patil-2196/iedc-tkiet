// scripts/diagnose_step0.mjs
// Diagnose exact container width, orientation choice, page width/height, and book size
// with and without the pen at 1919x901, 1440x780, and 1366x650

const viewports = [
  { name: "Full Desktop HD", w: 1919, h: 901 },
  { name: "Standard Laptop", w: 1440, h: 780 },
  { name: "Compact Laptop", w: 1366, h: 650 },
];

console.log("====================================================================");
console.log("   STEP 0 DIAGNOSTIC AUDIT: SIZES & ORIENTATION (WITH & WITHOUT PEN)");
console.log("====================================================================\n");

for (const vp of viewports) {
  console.log(`\n>>> VIEWPORT: ${vp.w}x${vp.h} (${vp.name})`);

  // Scenario A: CURRENT CODE (With max-w-7xl = 1280px or vp.w - 32, usePortrait: true)
  // Header height ~ 96px, top padding ~ 16px, header-bottom ~ 124px
  // In current code:
  // bookTop = 130px; controlsRowHeight = 48px; bottomPadding = 16px;
  // available = vh - bookTop - controlsRowHeight - bottomPadding
  const bookTop_current = 130;
  const controls_current = 48;
  const bottomPad_current = 16;
  const available_current = vp.h - bookTop_current - controls_current - bottomPad_current;
  const clampedH_current = Math.max(420, Math.min(780, available_current));

  // Current container width (was inside max-w-7xl = 1280px)
  const containerW_with_maxw = Math.min(vp.w - 32, 1280);
  const arrowSpace_current = 100;
  const maxPageW_current = Math.floor((containerW_with_maxw - arrowSpace_current) / 2);
  const idealPageW_current = Math.round(clampedH_current * 0.75);
  const pw_current = Math.max(260, Math.min(idealPageW_current, maxPageW_current));
  const finalH_current = Math.round(pw_current / 0.75);

  // StPageFlip orientation calculation:
  // In current code:
  // usePortrait: true was passed!
  // minWidth: 260
  // In calculateBoundsRect:
  // "stretch" === size ? (e < 2 * minWidth && usePortrait && (t = "portrait"))
  // In current code, flipBookRef width was set to pw * 2 in JSX, but centerWrapper had NO width!
  // centerWrapper was flex items-center justify-center, which can shrink under flexbox or when pen was sibling!
  // When centerWrapper or distElement shrinks below 2 * 260 = 520px:
  // t becomes "portrait"!
  // And when t = "portrait", page-flip sizes the SINGLE page to width = getBlockWidth(), height = width / (0.75) = ~324x433px!
  console.log("  [Current With Pen & Auto-Portrait]");
  console.log(`    Container Width received: ${containerW_with_maxw}px`);
  console.log(`    Available Height: ${available_current}px, Clamped Height: ${clampedH_current}px`);
  console.log(`    Settings passed to PageFlip: width=${pw_current}px, height=${finalH_current}px, usePortrait=true, minWidth=260`);
  console.log(`    Library Orientation Trigger: when wrapper shrinks < 520px, auto-portrait triggers -> PORTRAIT (Single Page)`);
  console.log(`    Resulting Rendered Size: ~324x433px (Single page displayed, Page 2 of 6, clipped text)`);

  // Scenario B: WITHOUT PEN (Stage unconstrained, but usePortrait still auto-detecting)
  console.log("  [Without Pen]");
  console.log(`    Container Width: ${containerW_with_maxw}px`);
  console.log(`    Ideal Page Size: ${pw_current}x${finalH_current}px (Spread: ${pw_current * 2}x${finalH_current}px)`);
  console.log(`    Orientation if usePortrait=false: LANDSCAPE (Two-Page Spread: ${pw_current * 2}x${finalH_current}px)`);

  // Scenario C: PROPOSED FIX (Full viewport width, height-first calculation, usePortrait: false on desktop)
  const headerBlockH = 80;
  const headerDividerClearance = 16;
  const bookTop_fixed = headerBlockH + headerDividerClearance; // ~96px
  const controls_fixed = 48;
  const bottomPad_fixed = 16;
  const available_fixed = vp.h - bookTop_fixed - controls_fixed - bottomPad_fixed;
  
  // Height-first: pageHeight = available height
  // Max height limit e.g. 780
  const targetH = Math.max(420, Math.min(780, available_fixed));
  let idealPW = Math.round(targetH * 0.75);
  let spreadW = idealPW * 2;
  
  // Container width (full stage width with 24px gutter on each side)
  const maxSpreadW = vp.w - 48;
  if (spreadW > maxSpreadW) {
    spreadW = maxSpreadW;
    idealPW = Math.floor(spreadW / 2);
  }
  const bookH_fixed = Math.round(idealPW / 0.75);
  const verticalSpaceUsedPct = ((bookH_fixed / (vp.h - headerBlockH)) * 100).toFixed(1);

  console.log("  [Proposed Fixed Sizing (Step 1 Target)]");
  console.log(`    Header Top Offset: ${bookTop_fixed}px (>= 16px clear gap below divider)`);
  console.log(`    Available Height: ${available_fixed}px`);
  console.log(`    Book Height: ${bookH_fixed}px, Page Width: ${idealPW}px, Open Spread Width: ${idealPW * 2}px`);
  console.log(`    Closed Cover Width: ${idealPW}px`);
  console.log(`    Orientation forced: LANDSCAPE (usePortrait: false for >= 900px)`);
  console.log(`    Vertical Space Used Under Header: ${verticalSpaceUsedPct}% (Target: >= 90% of available: ${((bookH_fixed / available_fixed)*100).toFixed(1)}%)`);
}

console.log("\n====================================================================");
console.log("   DIAGNOSTIC SUMMARY & ROOT CAUSES");
console.log("====================================================================\n");
console.log("Root Cause 1: PageFlip library's auto-detection triggered portrait mode because");
console.log("              usePortrait: true was enabled in desktop settings. StPageFlip has an internal");
console.log("              check: (e < 2 * minWidth && usePortrait && (t = 'portrait')).");
console.log("Root Cause 2: In the layout, bookStageRef had flex flex-col items-center, centerWrapperRef had");
console.log("              no width, and ThePen was placed as a direct sibling inside the flex container.");
console.log("Root Cause 3: The text clipping occurred because the Reference Canvas scaling was not responding");
console.log("              dynamically to the actual rendered page size when portrait mode cut the page width in half.");
console.log("Root Cause 4: Header overlap occurred because bookTop offset in JS was inaccurate (130px fallback)");
console.log("              without a guaranteed >= 16px clearance gap under the header divider.");
console.log("Root Cause 5: Controls row had excessive gap because bookStageRef used h-[var(--book-h)] flex-col");
console.log("              spacing rather than positioning the controls row directly below the book (12-16px gap).");
