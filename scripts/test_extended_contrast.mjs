// scripts/test_extended_contrast.mjs

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

function srgbLuminance([r8, g8, b8]) {
  const [r, g, b] = [r8, g8, b8].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fgHex, bgHex) {
  const lum1 = srgbLuminance(hexToRgb(fgHex));
  const lum2 = srgbLuminance(hexToRgb(bgHex));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const auditItems = [
  // 1. Darkest part of vignette (--paper-edge: #E2D3B3)
  {
    category: "Vignette Darkest Edge",
    item: "Body ink on vignette edge",
    fg: "#1B2333",
    bg: "#E2D3B3",
  },
  {
    category: "Vignette Darkest Edge",
    item: "Heading ink on vignette edge",
    fg: "#0F1B44",
    bg: "#E2D3B3",
  },
  {
    category: "Vignette Darkest Edge",
    item: "Folio & metadata on vignette edge",
    fg: "#4B5468",
    bg: "#E2D3B3",
  },
  {
    category: "Vignette Darkest Edge",
    item: "Accent ink on vignette edge",
    fg: "#1E40AF",
    bg: "#E2D3B3",
  },

  // 2. Stamp Captions
  {
    category: "Stamp Captions",
    item: "Primary caption on stamp paper",
    fg: "#4B5468",
    bg: "#FBF6E9",
  },
  {
    category: "Stamp Captions",
    item: "Secondary caption on cardstock",
    fg: "#4B5468",
    bg: "#E8DCBF",
  },

  // 3. Ribbon Label
  {
    category: "Ribbon Label",
    item: "Cream foil text on ribbon top gradient",
    fg: "#FBF6E9",
    bg: "#1E3A8A",
  },
  {
    category: "Ribbon Label",
    item: "Cream foil text on ribbon bottom navy",
    fg: "#FBF6E9",
    bg: "#172554",
  },

  // 4. Sources Block
  {
    category: "Sources Block",
    item: "Header 'SOURCES & REFERENCES' on cardstock",
    fg: "#0F1B44",
    bg: "#FAF5EA",
  },
  {
    category: "Sources Block",
    item: "Reference link on cardstock",
    fg: "#1E40AF",
    bg: "#FAF5EA",
  },
  {
    category: "Sources Block",
    item: "Domain name & numbering on cardstock",
    fg: "#4B5468",
    bg: "#FAF5EA",
  },

  // 5. Placeholder Badge
  {
    category: "Placeholder Badge",
    item: "Badge text 'Dev Placeholder' on badge amber-100",
    fg: "#451A03",
    bg: "#FEF3C7",
  },
  {
    category: "Placeholder Badge",
    item: "Warning icon on badge amber-100",
    fg: "#92400E",
    bg: "#FEF3C7",
  },
];

console.log("==========================================================================");
console.log("EXTENDED CONTRAST CHECK AUDIT (WCAG AA >= 4.5:1 REQUIRED)");
console.log("==========================================================================");

let allPass = true;
for (const item of auditItems) {
  const ratio = contrastRatio(item.fg, item.bg);
  const pass = ratio >= 4.5;
  if (!pass) allPass = false;
  console.log(
    `[${pass ? "PASS" : "FAIL"}] ${item.category} - ${item.item}: ` +
      `${item.fg} on ${item.bg} = ${ratio.toFixed(2)}:1`
  );
}

console.log("==========================================================================");
if (allPass) {
  console.log("RESULT: 100% of extended UI elements meet or exceed WCAG AA (>= 4.5:1)!");
} else {
  console.error("RESULT: Some elements failed contrast check.");
  process.exit(1);
}
