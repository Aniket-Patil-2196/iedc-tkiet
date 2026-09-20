import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// CDP minimal client using native WebSocket
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
  console.log("RUNNING CDP VIEWPORT, LIGHTBOX & BENTO GRID TESTS");
  console.log("====================================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const remoteDebuggingPort = 9223;
  const userDataDir = path.join(process.cwd(), ".edge-cdp-test-part1-2");

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

    // 1. Test viewports for overflow
    const viewports = [
      { w: 320, h: 800 },
      { w: 375, h: 800 },
      { w: 768, h: 800 },
      { w: 1024, h: 800 },
      { w: 1366, h: 768 },
      { w: 1440, h: 900 },
      { w: 1920, h: 1080 },
    ];

    console.log("Warming up /events route...");
    await client.send("Page.navigate", { url: "http://localhost:3000/events" });
    await new Promise((r) => setTimeout(r, 4000));

    console.log("[TEST 1] Responsive Viewport Audit for /events:");
    for (const vp of viewports) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.w < 768,
      });

      await client.send("Page.navigate", { url: "http://localhost:3000/events" });
      await new Promise((r) => setTimeout(r, 2000));

      const evalRes = await client.send("Runtime.evaluate", {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        })`,
        returnByValue: true,
      });

      const data = evalRes.result.value;
      console.log(`  Viewport ${vp.w}x${vp.h}: scrollWidth=${data.scrollWidth}, clientWidth=${data.clientWidth}, hasOverflow=${data.hasHorizontalOverflow}`);
    }

    // 2. Check NextEventCard Visibility at 1440x900 and 1366x768
    console.log("\n[TEST 2] NextEventCard First-Screen Visibility Check after Hero:");
    for (const [w, h] of [[1440, 900], [1366, 768]]) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile: false,
      });

      await client.send("Page.navigate", { url: "http://localhost:3000/events#upcoming" });
      await new Promise((r) => setTimeout(r, 2000));

      const cardMetrics = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const el = document.getElementById("upcoming");
          el.scrollIntoView({ behavior: "instant" });
          const card = document.querySelector("article");
          if (!card) return null;
          const rect = card.getBoundingClientRect();
          return {
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            isWithinFirstScreen: rect.bottom <= window.innerHeight,
            bottomMargin: window.innerHeight - rect.bottom
          };
        })()`,
        returnByValue: true,
      });

      console.log(`  At ${w}x${h}:`, cardMetrics.result.value);
    }

    // 3. Capture Screenshots
    console.log("\n[TEST 3] Capturing Screenshots:");

    // A. Desktop 1440x900 Upcoming Card
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
    await new Promise((r) => setTimeout(r, 500));

    const cardScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "part1_next_event_card_desktop.png"), Buffer.from(cardScreen.data, "base64"));
    console.log("  Saved part1_next_event_card_desktop.png");

    // B. Lightbox Open
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector("button[aria-label*='View full size poster']");
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const lightboxScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "part1_poster_lightbox.png"), Buffer.from(lightboxScreen.data, "base64"));
    console.log("  Saved part1_poster_lightbox.png");

    // Close lightbox via Esc key
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

    // C. Bento Grid Archive Desktop
    await client.send("Runtime.evaluate", {
      expression: `document.getElementById("archive").scrollIntoView({ behavior: "instant" });`,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const bentoScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "part2_bento_grid_desktop.png"), Buffer.from(bentoScreen.data, "base64"));
    console.log("  Saved part2_bento_grid_desktop.png");

    // D. Mobile 375x800 Card & Archive
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
    await new Promise((r) => setTimeout(r, 500));

    const mobileCardScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "part1_next_event_card_mobile.png"), Buffer.from(mobileCardScreen.data, "base64"));
    console.log("  Saved part1_next_event_card_mobile.png");

    await client.send("Runtime.evaluate", {
      expression: `document.getElementById("archive").scrollIntoView({ behavior: "instant" });`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const mobileBentoScreen = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(artifactDir, "part2_bento_grid_mobile.png"), Buffer.from(mobileBentoScreen.data, "base64"));
    console.log("  Saved part2_bento_grid_mobile.png");

    client.close();
    console.log("\nALL TESTS AND SCREENSHOT CAPTURES COMPLETED SUCCESSFULLY!");
  } finally {
    edgeProcess.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
