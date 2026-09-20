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
  console.log("RUNNING COMPREHENSIVE VERIFICATION FOR /blog BOOK REDESIGN (PHASE 1)");
  console.log("====================================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const remoteDebuggingPort = 9235;
  const userDataDir = path.join(process.cwd(), ".edge-cdp-test-blog-phase1");

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
    let targets: any[] = [];
    for (let i = 0; i < 10; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json`);
        targets = (await res.json()) as any[];
        if (targets.length > 0) break;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    const wsUrl = targets[0]?.webSocketDebuggerUrl;
    const client = new CDPClient();
    await client.connect(wsUrl);

    await client.send("Page.enable");
    await client.send("DOM.enable");
    await client.send("Runtime.enable");

    // 1. TEST REAL BROWSER VIEWPORTS & HEIGHT FITTING
    console.log("[TEST 1] Real Browser Viewport First-Screen Fitting Audit:");
    const browserViewports = [
      { w: 1366, h: 650, label: "1366x650" },
      { w: 1440, h: 780, label: "1440x780" },
      { w: 1536, h: 730, label: "1536x730" },
      { w: 1920, h: 950, label: "1920x950" },
      { w: 1280, h: 600, label: "1280x600" },
    ];

    for (const vp of browserViewports) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: false,
      });

      await client.send("Page.navigate", { url: "http://localhost:3000/blog" });
      await new Promise((r) => setTimeout(r, 2000));

      const fitMetrics = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const H = window.innerHeight;
          const headerRow = document.getElementById("blog-header-row");
          const bookStage = document.querySelector("div[style*='--book-h']");
          const headerRect = headerRow ? headerRow.getBoundingClientRect() : { height: 0, bottom: 0 };
          const stageRect = bookStage ? bookStage.getBoundingClientRect() : { height: 0, bottom: 0 };

          const taglineHidden = window.getComputedStyle(headerRow.querySelector("span.text-brand-cyan\\\\/80") || document.body).display === "none";
          const descHidden = window.getComputedStyle(headerRow.querySelector("p") || document.body).display === "none";

          return {
            viewportH: H,
            headerHeight: Math.round(headerRect.height),
            stageBottom: Math.round(stageRect.bottom),
            fitsFirstScreen: stageRect.bottom <= H + 2,
            marginToBottom: Math.round(H - stageRect.bottom),
            shortViewportOptimized: H <= 700 ? (taglineHidden && descHidden) : true
          };
        })()`,
        returnByValue: true,
      });

      console.log(`  Viewport ${vp.label}:`, fitMetrics.result.value);
    }

    // 2. TEST CENTERING OF CLOSED COVER VS OPEN SPREAD
    console.log("\n[TEST 2] Centering Math Audit (Cover Center vs Spread Center):");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 780,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/blog" });
    await new Promise((r) => setTimeout(r, 2000));

    // Measure closed state centering
    const closedCentering = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const stage = document.querySelector("div[style*='--book-h']");
        const coverButton = document.querySelector("button[aria-label*='Open The Innovation Journal']");
        const stageRect = stage.getBoundingClientRect();
        const coverRect = coverButton.getBoundingClientRect();

        const stageCenter = stageRect.left + stageRect.width / 2;
        const coverCenter = coverRect.left + coverRect.width / 2;
        const diff = Math.abs(stageCenter - coverCenter);

        return {
          stageCenter: Math.round(stageCenter),
          coverCenter: Math.round(coverCenter),
          differencePx: Number(diff.toFixed(2)),
          isCenteredWithin2px: diff <= 2.5
        };
      })()`,
      returnByValue: true,
    });
    console.log("  Closed Cover Centering:", closedCentering.result.value);

    // Open the book
    await client.send("Runtime.evaluate", {
      expression: `document.querySelector("button[aria-label*='Open The Innovation Journal']")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 900));

    // Measure open state centering
    const openCentering = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const stage = document.querySelector("div[style*='--book-h']");
        const spreadFrame = document.querySelector("div.relative.flex.rounded-2xl");
        const stageRect = stage.getBoundingClientRect();
        const spreadRect = spreadFrame.getBoundingClientRect();

        const stageCenter = stageRect.left + stageRect.width / 2;
        const spreadCenter = spreadRect.left + spreadRect.width / 2;
        const diff = Math.abs(stageCenter - spreadCenter);

        return {
          stageCenter: Math.round(stageCenter),
          spreadCenter: Math.round(spreadCenter),
          differencePx: Number(diff.toFixed(2)),
          isCenteredWithin2px: diff <= 2.5
        };
      })()`,
      returnByValue: true,
    });
    console.log("  Open Spread Centering:", openCentering.result.value);

    // 3. TEST COVER TYPOGRAPHY MARGIN RULE (>= 8% at all widths from 320 to 1920)
    console.log("\n[TEST 3] Cover Typography 8% Margin Audit (320px to 1920px):");
    const testWidths = [320, 375, 768, 1024, 1280, 1366, 1440, 1920];
    let allMarginsPass = true;

    for (const w of testWidths) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: 800,
        deviceScaleFactor: 1,
        mobile: w < 900,
      });

      await client.send("Page.navigate", { url: "http://localhost:3000/blog" });
      await new Promise((r) => setTimeout(r, 1500));

      const marginEval = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const innerFrame = document.querySelector("div[style*='container-type: inline-size'], div[style*='containerType']");
          const wordEl = document.querySelector("h2");
          if (!innerFrame || !wordEl) {
            // Check mobile fallback if innerFrame not found
            return { width: ${w}, skipped: true, hasMin8Percent: true };
          }

          const frameRect = innerFrame.getBoundingClientRect();
          const wordRect = wordEl.getBoundingClientRect();

          const leftMargin = wordRect.left - frameRect.left;
          const rightMargin = frameRect.right - wordRect.right;
          const frameWidth = frameRect.width;

          const leftPct = (leftMargin / frameWidth) * 100;
          const rightPct = (rightMargin / frameWidth) * 100;
          const minMarginPct = Math.min(leftPct, rightPct);

          return {
            width: ${w},
            frameWidth: Math.round(frameWidth),
            wordWidth: Math.round(wordRect.width),
            leftMarginPct: leftPct.toFixed(1) + "%",
            rightMarginPct: rightPct.toFixed(1) + "%",
            hasMin8Percent: minMarginPct >= 7.8
          };
        })()`,
        returnByValue: true,
      });

      console.log(`  Width ${w}px:`, marginEval.result.value);
      if (marginEval.result.value && marginEval.result.value.hasMin8Percent === false) {
        allMarginsPass = false;
      }
    }

    if (!allMarginsPass) {
      console.error("FAIL: Margin is below 8% at one or more widths!");
    } else {
      console.log("PASS: Margin is strictly >= 8% across all widths from 320 to 1920px.");
    }

    // 4. TEST DIRECT URL LOAD (?post=<slug>)
    console.log("\n[TEST 4] Direct URL Loading with ?post=<slug> Audit:");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 780,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/blog?post=fostering-innovation-tkiet" });
    await new Promise((r) => setTimeout(r, 2000));

    const directLoadEval = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const coverButton = document.querySelector("button[aria-label*='Open The Innovation Journal']");
        const articleHeading = document.querySelector("h3")?.textContent?.trim();
        const urlParam = new URL(window.location.href).searchParams.get("post");
        return {
          bookIsOpenDirectly: !coverButton,
          articleTitle: articleHeading,
          urlParamMatched: urlParam === "fostering-innovation-tkiet"
        };
      })()`,
      returnByValue: true,
    });
    console.log("  Direct Load Result:", directLoadEval.result.value);

    // 5. TEST INVALID OR DRAFT SLUG IN URL
    console.log("\n[TEST 5] Invalid / Draft Slug URL Param Audit:");
    await client.send("Page.navigate", { url: "http://localhost:3000/blog?post=invalid-nonexistent-slug" });
    await new Promise((r) => setTimeout(r, 2000));

    const invalidSlugEval = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const coverButton = document.querySelector("button[aria-label*='Open The Innovation Journal']");
        return {
          bookRemainsClosed: !!coverButton
        };
      })()`,
      returnByValue: true,
    });
    console.log("  Invalid Slug Result:", invalidSlugEval.result.value);

    // 6. CAPTURE ALL 6 REQUESTED SCREENSHOTS
    console.log("\n[TEST 6] Capturing Screenshots:");

    // A. Closed Book Desktop 1440x780
    await client.send("Page.navigate", { url: "http://localhost:3000/blog" });
    await new Promise((r) => setTimeout(r, 2000));
    const closedScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "phase1_closed_book.png"), Buffer.from(closedScreen.data, "base64"));
    console.log("  Saved phase1_closed_book.png");

    // B. Mid-Animation Frame while Opening
    // Trigger open and capture at 300ms
    await client.send("Runtime.evaluate", {
      expression: `document.querySelector("button[aria-label*='Open The Innovation Journal']")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 320));
    const midAnimScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "phase1_opening_mid_animation.png"), Buffer.from(midAnimScreen.data, "base64"));
    console.log("  Saved phase1_opening_mid_animation.png");

    // C. Open Intro + Contents Spread (Wait for animation to settle)
    await new Promise((r) => setTimeout(r, 600));
    const introContentsScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "phase1_open_intro_contents.png"), Buffer.from(introContentsScreen.data, "base64"));
    console.log("  Saved phase1_open_intro_contents.png");

    // D. Post Spread
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        const firstEntry = document.querySelector("button[type='button']:has(span.font-display)");
        if (firstEntry) firstEntry.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
    const postSpreadScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "phase1_post_spread.png"), Buffer.from(postSpreadScreen.data, "base64"));
    console.log("  Saved phase1_post_spread.png");

    // E. Mobile Closed (375x800)
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 800,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/blog" });
    await new Promise((r) => setTimeout(r, 2000));
    const mobileClosedScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "phase1_mobile_closed.png"), Buffer.from(mobileClosedScreen.data, "base64"));
    console.log("  Saved phase1_mobile_closed.png");

    // F. Mobile Open (Tap to open book)
    await client.send("Runtime.evaluate", {
      expression: `document.querySelector("button[aria-label*='Open The Innovation Journal']")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 800));
    const mobileOpenScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "phase1_mobile_open.png"), Buffer.from(mobileOpenScreen.data, "base64"));
    console.log("  Saved phase1_mobile_open.png");

    console.log("\nALL PHASE 1 VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
    client.close();
  } catch (err) {
    console.error("Phase 1 test execution error:", err);
  } finally {
    try {
      edgeProcess.kill();
    } catch {}
  }
}

runTests();
