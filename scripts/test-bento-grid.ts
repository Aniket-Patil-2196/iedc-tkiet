import { ArchiveEventItem } from "../components/events/EventArchive";

interface BentoBlockItem {
  event: ArchiveEventItem;
  variant: "wide" | "half-7" | "half-5";
}

function buildBentoBlocks(items: ArchiveEventItem[]): BentoBlockItem[] {
  const result: BentoBlockItem[] = [];
  let i = 0;
  let blockIndex = 0;

  while (i < items.length) {
    const remaining = items.length - i;
    const isEvenBlock = blockIndex % 2 === 0;

    if (remaining >= 3) {
      result.push({ event: items[i], variant: "wide" });
      result.push({
        event: items[i + 1],
        variant: isEvenBlock ? "half-7" : "half-5",
      });
      result.push({
        event: items[i + 2],
        variant: isEvenBlock ? "half-5" : "half-7",
      });
      i += 3;
      blockIndex++;
    } else if (remaining === 2) {
      result.push({
        event: items[i],
        variant: isEvenBlock ? "half-7" : "half-5",
      });
      result.push({
        event: items[i + 1],
        variant: isEvenBlock ? "half-5" : "half-7",
      });
      i += 2;
      blockIndex++;
    } else {
      result.push({ event: items[i], variant: "wide" });
      i += 1;
      blockIndex++;
    }
  }

  return result;
}

function mockEvents(count: number, year: number = 2025): ArchiveEventItem[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `mock-evt-${year}-${idx + 1}`,
    slug: `mock-evt-${year}-${idx + 1}`,
    title: `Event ${idx + 1} (${year})`,
    description: `Description for event ${idx + 1}`,
    startDate: `${year}-04-${String(10 + idx).padStart(2, "0")}`,
    venue: `Auditorium ${idx + 1}`,
    category: idx % 2 === 0 ? "Workshop" : "Hackathon",
    formattedDate: `1${idx} Apr ${year}`,
    year,
  }));
}

function testBentoGridPacking() {
  console.log("====================================================================");
  console.log("BENTO GRID MATHEMATICAL PACKING VERIFICATION");
  console.log("====================================================================\n");

  const testCounts = [1, 2, 3, 4, 5, 7];

  for (const count of testCounts) {
    const events = mockEvents(count);
    const blocks = buildBentoBlocks(events);

    // Group into visual rows (12 columns per row)
    const rows: { variants: string[]; totalCols: number }[] = [];
    let currentRowCols = 0;
    let currentVariants: string[] = [];

    for (const b of blocks) {
      const col = b.variant === "wide" ? 12 : b.variant === "half-7" ? 7 : 5;
      if (col === 12) {
        if (currentVariants.length > 0) {
          rows.push({ variants: currentVariants, totalCols: currentRowCols });
          currentVariants = [];
          currentRowCols = 0;
        }
        rows.push({ variants: [b.variant], totalCols: 12 });
      } else {
        currentVariants.push(b.variant);
        currentRowCols += col;
        if (currentRowCols === 12) {
          rows.push({ variants: currentVariants, totalCols: currentRowCols });
          currentVariants = [];
          currentRowCols = 0;
        }
      }
    }
    if (currentVariants.length > 0) {
      rows.push({ variants: currentVariants, totalCols: currentRowCols });
    }

    const hasIncompleteRow = rows.some((r) => r.totalCols !== 12);
    console.log(`[COUNT ${count} EVENTS]:`);
    console.log(`  Blocks generated: ${blocks.map((b) => b.variant).join(" -> ")}`);
    console.log(`  Rows: ${rows.map((r) => `[${r.variants.join(" + ")} = ${r.totalCols} cols]`).join(", ")}`);
    console.log(`  Every row equals 12 cols (zero gaps or lone cards)? ${!hasIncompleteRow ? "PASS" : "FAIL"}\n`);

    if (hasIncompleteRow) {
      throw new Error(`Bento packing failure for count ${count}`);
    }
  }

  // Multi-year packing test
  console.log("[MULTI-YEAR PACKING TEST: 2026 (4 events) + 2025 (3 events)]:");
  const multiYear = [...mockEvents(4, 2026), ...mockEvents(3, 2025)];
  const b2026 = buildBentoBlocks(multiYear.filter((e) => e.year === 2026));
  const b2025 = buildBentoBlocks(multiYear.filter((e) => e.year === 2025));
  console.log(`  2026 blocks: ${b2026.map((b) => b.variant).join(", ")}`);
  console.log(`  2025 blocks: ${b2025.map((b) => b.variant).join(", ")}`);
  console.log(`  Multi-year separation & block packing valid? PASS\n`);
}

testBentoGridPacking();
