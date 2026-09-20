import { spawn } from "child_process";
import fs from "fs";
import path from "path";

async function getWebSocketDebuggerUrl(port: number): Promise<string> {
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = (await res.json()) as any[];
  const pageTarget = targets.find((t: any) => t.type === "page") || targets[0];
  if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
    throw new Error("Could not acquire DevTools page target");
  }
  return pageTarget.webSocketDebuggerUrl;
}

class CDPClient {
  private ws!: WebSocket;
  private messageId = 1;
  private pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  async connect(url: string): Promise<void> {
    this.ws = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  async send(method: string, params: Record<string, any> = {}): Promise<any> {
    const id = this.messageId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function runTests() {
  console.log("====================================================================");
  console.log("RUNNING COMPREHENSIVE VERIFICATION FOR /events REWORK");
  console.log("====================================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const remoteDebuggingPort = 9225;
  const userDataDir = path.join(process.cwd(), ".edge-cdp-test-hero-unified");

  const edgeProcess = spawn(edgePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  const artifactDir = "C:\\Users\\anike\\.gemini\\antigravity\\brain\\37667016-d4ca-4929-986d-ceb1e65be0ee";

  try {
    const wsUrl = await getWebSocketDebuggerUrl(remoteDebuggingPort);
    const client = new CDPClient();
    await client.connect(wsUrl);

    await client.send("Page.enable");
    await client.send("DOM.enable");
    await client.send("Runtime.enable");

    // 1. HERO OPTICAL CENTERING MEASUREMENTS
    console.log("[TEST 1] Hero Content Block Vertical Center Measurements (Before vs After):");
    const heroViewports = [
      { w: 1440, h: 900, label: "1440x900" },
      { w: 1366, h: 768, label: "1366x768" },
      { w: 1920, h: 1080, label: "1920x1080" },
      { w: 375, h: 800, label: "375x800" },
    ];

    for (const vp of heroViewports) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.w < 768,
      });

      await client.send("Page.navigate", { url: "http://localhost:3000/events" });
      await new Promise((r) => setTimeout(r, 2500));

      const heroMetrics = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const heroSection = document.querySelector("section");
          const heroWrapper = heroSection.querySelector("div.flex-1");
          const contentBox = heroWrapper.querySelector("div.space-y-6");
          const paragraph = contentBox.querySelector("p");
          const scrollCue = heroSection.querySelector("a[href='#upcoming']");

          const H = window.innerHeight;

          // Current (AFTER upward shift)
          const rectAfter = contentBox.getBoundingClientRect();
          const centerAfter = (rectAfter.top + rectAfter.bottom) / 2;
          const ratioAfter = ((centerAfter / H) * 100).toFixed(1);

          // Simulate BEFORE by removing the translate-y classes or undoing transform
          const currentTransform = window.getComputedStyle(heroWrapper).transform;
          let shiftPx = 0;
          if (currentTransform && currentTransform !== "none") {
            const matrix = currentTransform.match(/matrix\\((.+)\\)/);
            if (matrix) {
              const values = matrix[1].split(',').map(parseFloat);
              shiftPx = values[5]; // Y translation in pixels
            }
          }
          const centerBefore = centerAfter - shiftPx; // since shiftPx is negative
          const ratioBefore = ((centerBefore / H) * 100).toFixed(1);

          // Clear space between paragraph and scroll cue
          const pRect = paragraph.getBoundingClientRect();
          const cueRect = scrollCue.getBoundingClientRect();
          const clearSpace = cueRect.top - pRect.bottom;

          return {
            viewportH: H,
            centerBeforePx: Math.round(centerBefore),
            ratioBefore: ratioBefore + "%",
            centerAfterPx: Math.round(centerAfter),
            ratioAfter: ratioAfter + "%",
            shiftAmountPx: Math.round(Math.abs(shiftPx)),
            clearSpacePx: Math.round(clearSpace),
            hasMinClearSpace32: clearSpace >= 32
          };
        })()`,
        returnByValue: true,
      });

      console.log(`  ${vp.label}:`, heroMetrics.result.value);
    }

    // 2. RESPONSIVE VIEWPORT HORIZONTAL OVERFLOW CHECK
    console.log("\n[TEST 2] Viewport Horizontal Overflow Audit (320 to 1920):");
    const viewports = [
      { w: 320, h: 800 },
      { w: 375, h: 800 },
      { w: 768, h: 800 },
      { w: 1024, h: 800 },
      { w: 1366, h: 768 },
      { w: 1440, h: 900 },
      { w: 1920, h: 1080 },
    ];

    for (const vp of viewports) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.w < 768,
      });

      await client.send("Page.navigate", { url: "http://localhost:3000/events" });
      await new Promise((r) => setTimeout(r, 1500));

      const overflowRes = await client.send("Runtime.evaluate", {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        })`,
        returnByValue: true,
      });
      console.log(`  ${vp.w}x${vp.h}:`, overflowRes.result.value);
    }

    // 3. UPCOMING UNIFIED LIST AUDIT
    console.log("\n[TEST 3] Upcoming Unified List Audit:");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/events#upcoming" });
    await new Promise((r) => setTimeout(r, 2000));

    const upcomingAudit = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const upcomingSec = document.getElementById("upcoming");
        const eyebrow = upcomingSec.querySelector("span.tracking-\\\\[0\\\\.2em\\\\]")?.textContent?.trim();
        const heading = upcomingSec.querySelector("h2")?.textContent?.trim();
        const countBadge = upcomingSec.querySelector("h2 span:last-child")?.textContent?.trim();
        
        // Cards
        const cards = Array.from(upcomingSec.querySelectorAll("article"));
        const cardInfos = cards.map((c, idx) => {
          const title = c.querySelector("h3")?.textContent?.trim();
          const spans = Array.from(c.querySelectorAll("span"));
          const hasNextChip = spans.some(s => s.textContent?.trim().includes("NEXT"));
          const dateText = c.querySelector(".font-mono")?.textContent?.trim();
          const hasCountdown = !!c.textContent.includes("STARTS IN");
          const isDateTBA = c.textContent.includes("Date to be announced");
          return {
            index: idx + 1,
            title,
            hasPriorityNextBadge: hasNextChip,
            isDateTBA,
            hasCountdown
          };
        });

        // Show more button
        const showMoreBtn = upcomingSec.querySelector("button:has(svg.lucide-chevron-down), button:has(svg.lucide-chevron-up)");
        const showMoreText = showMoreBtn ? showMoreBtn.textContent?.trim() : null;

        return {
          eyebrow,
          heading,
          countBadge,
          totalRenderedCards: cards.length,
          showMoreText,
          cards: cardInfos
        };
      })()`,
      returnByValue: true,
    });
    console.log("  Upcoming List Audit (Initial):", JSON.stringify(upcomingAudit.result.value, null, 2));

    // Expand list to verify all cards and postponed event
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Show"));
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const expandedAudit = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const upcomingSec = document.getElementById("upcoming");
        const cards = Array.from(upcomingSec.querySelectorAll("article"));
        return cards.map((c, idx) => {
          const title = c.querySelector("h3")?.textContent?.trim();
          const spans = Array.from(c.querySelectorAll("span"));
          const hasNextChip = spans.some(s => s.textContent?.trim().includes("NEXT"));
          const isDateTBA = c.textContent.includes("Date to be announced");
          const hasCountdown = c.textContent.includes("STARTS IN");
          const hasRegisterCTA = Array.from(c.querySelectorAll("a, button")).some(el => {
            const t = el.textContent?.toLowerCase() || "";
            return (t.includes("register") || t.includes("ticket")) && !t.includes("view recap");
          });
          return {
            index: idx + 1,
            title,
            hasNextChip,
            isDateTBA,
            hasCountdown,
            hasRegisterCTA
          };
        });
      })()`,
      returnByValue: true,
    });
    console.log("  Upcoming List Audit (Expanded - 5 cards):", JSON.stringify(expandedAudit.result.value, null, 2));

    // 4. PAST EVENTS BENTO GRID AUDIT
    console.log("\n[TEST 4] Past Events Bento Grid Audit:");
    const pastAudit = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const archiveSec = document.getElementById("archive");
        const hasArchiveRecordText = document.body.textContent.includes("ARCHIVE RECORD");
        const bentoLinks = Array.from(archiveSec.querySelectorAll("a[href*='/events/']"));
        const wideCards = bentoLinks.filter(l => l.style.gridColumn === "1 / -1" || l.className.includes("lg:col-span-12"));
        
        const cardMetrics = bentoLinks.slice(0, 3).map(l => {
          const rect = l.getBoundingClientRect();
          const img = l.querySelector("img");
          return {
            href: l.getAttribute("href"),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            gridColumn: l.style.gridColumn,
            imageObjectPosition: img ? img.style.objectPosition : "none"
          };
        });

        return {
          hasArchiveRecordText, // Must be FALSE
          totalPastCards: bentoLinks.length,
          wideCardsCount: wideCards.length,
          first3CardsMetrics: cardMetrics
        };
      })()`,
      returnByValue: true,
    });
    console.log("  Past Bento Audit:", JSON.stringify(pastAudit.result.value, null, 2));

    // 5. CAPTURE HIGH-QUALITY SCREENSHOTS FOR WALKTHROUGH
    console.log("\n[TEST 5] Capturing Screenshots:");

    // A. Hero Optically Centered 1440x900
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/events" });
    await new Promise((r) => setTimeout(r, 2000));
    const hero1440Screen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "hero_optically_centered_1440x900.png"), Buffer.from(hero1440Screen.data, "base64"));
    console.log("  Saved hero_optically_centered_1440x900.png");

    // B. Hero 375x800 Mobile
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 800,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/events" });
    await new Promise((r) => setTimeout(r, 2000));
    const hero375Screen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "hero_optically_centered_375x800.png"), Buffer.from(hero375Screen.data, "base64"));
    console.log("  Saved hero_optically_centered_375x800.png");

    // C. Unified Upcoming List Desktop 1440x900
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/events#upcoming" });
    await new Promise((r) => setTimeout(r, 2000));
    await client.send("Runtime.evaluate", {
      expression: `document.getElementById("upcoming").scrollIntoView({ behavior: "instant" });`,
    });
    await new Promise((r) => setTimeout(r, 600));
    const upcomingDesktopScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "upcoming_unified_desktop.png"), Buffer.from(upcomingDesktopScreen.data, "base64"));
    console.log("  Saved upcoming_unified_desktop.png");

    // D. Unified Upcoming List Mobile 375x800
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 800,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/events#upcoming" });
    await new Promise((r) => setTimeout(r, 2000));
    await client.send("Runtime.evaluate", {
      expression: `document.getElementById("upcoming").scrollIntoView({ behavior: "instant" });`,
    });
    await new Promise((r) => setTimeout(r, 600));
    const upcomingMobileScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "upcoming_unified_mobile.png"), Buffer.from(upcomingMobileScreen.data, "base64"));
    console.log("  Saved upcoming_unified_mobile.png");

    // E. Lightbox Verification
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/events#upcoming" });
    await new Promise((r) => setTimeout(r, 2000));
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector("button[aria-label*='View full size poster']");
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
    const lightboxScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "poster_lightbox_unified.png"), Buffer.from(lightboxScreen.data, "base64"));
    console.log("  Saved poster_lightbox_unified.png");

    // F. Bento Grid Archive Desktop
    await client.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await client.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await new Promise((r) => setTimeout(r, 500));

    await client.send("Runtime.evaluate", {
      expression: `document.getElementById("archive").scrollIntoView({ behavior: "instant" });`,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const bentoDesktopScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "past_bento_desktop.png"), Buffer.from(bentoDesktopScreen.data, "base64"));
    console.log("  Saved past_bento_desktop.png");

    console.log("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
    client.close();
  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    try {
      edgeProcess.kill();
    } catch {}
  }
}

runTests();
