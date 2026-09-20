import http from "http";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:\\Users\\anike\\.gemini\\antigravity\\brain\\37667016-d4ca-4929-986d-ceb1e65be0ee";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

class SimpleCDP {
  ws: any;
  id = 0;
  callbacks = new Map<number, (res: any) => void>();

  async connect(wsUrl: string) {
    const WebSocket = (await import("undici-types" as any).catch(() => null)) ? null : null;
    // Using global WebSocket available in Node 22!
    this.ws = new (globalThis as any).WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event: any) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        this.callbacks.get(msg.id)!(msg);
        this.callbacks.delete(msg.id);
      }
    };
  }

  send(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve) => {
      const id = ++this.id;
      this.callbacks.set(id, (res) => resolve(res.result));
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runViewportAudit() {
  console.log("=== STARTING VIEWPORT AUDIT & SCREENSHOT TEST ===");

  if (!fs.existsSync(EDGE_PATH)) {
    console.warn("Edge executable not found at expected path:", EDGE_PATH);
    return;
  }

  const port = 9222;
  const edgeProc = spawn(
    EDGE_PATH,
    [
      `--remote-debugging-port=${port}`,
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "http://localhost:3000/events",
    ],
    { stdio: "ignore" }
  );

  await sleep(1500);

  try {
    const targets = await getJson(`http://localhost:${port}/json`);
    const pageTarget = targets.find((t: any) => t.type === "page") || targets[0];
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error("Could not acquire DevTools page target");
    }

    const cdp = new SimpleCDP();
    await cdp.connect(pageTarget.webSocketDebuggerUrl);

    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");

    await cdp.send("Page.navigate", { url: "http://localhost:3000/events" });
    await sleep(2000);

    const widths = [320, 375, 768, 1024, 1366, 1440, 1920];
    const results: any[] = [];

    for (const w of widths) {
      const h = w === 1440 ? 900 : 800;
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile: w < 768,
      });

      await sleep(300);

      const evalRes = await cdp.send("Runtime.evaluate", {
        expression: `({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth,
        })`,
        returnByValue: true,
      });

      const data = evalRes.result?.value;
      results.push({ width: w, ...data });

      // Save a screenshot for 1440x900 and 375 mobile
      if (w === 1440 || w === 375) {
        const screenshot = await cdp.send("Page.captureScreenshot", {
          format: "png",
        });
        const buffer = Buffer.from(screenshot.data, "base64");
        const outPath = path.join(ARTIFACTS_DIR, `step_a_${w}x${h}.png`);
        fs.writeFileSync(outPath, buffer);
        console.log(`Saved screenshot for ${w}x${h} to: ${outPath}`);
      }
    }

    console.table(results);

    // Test 1440x900: verify next-event card visibility after hero
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const checkNextCard = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const upcoming = document.getElementById('upcoming');
        if (upcoming) {
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(0, upcoming.offsetTop);
        }
        const card = document.querySelector('#upcoming article');
        const cardRect = card ? card.getBoundingClientRect() : null;
        
        return {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          scrollY: window.scrollY,
          cardFound: Boolean(card),
          cardTopInViewport: cardRect ? Math.round(cardRect.top) : null,
          cardBottomInViewport: cardRect ? Math.round(cardRect.bottom) : null,
          cardHeight: cardRect ? Math.round(cardRect.height) : null,
          isWholeCardVisible: cardRect ? (cardRect.top >= 0 && cardRect.bottom <= window.innerHeight) : false,
        };
      })()`,
      returnByValue: true,
    });

    console.log("1440x900 First Screen After Hero Audit:", checkNextCard.result?.value);
    await sleep(500);

    // Capture screenshot of next-event card at 1440x900
    const cardScreenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
    });
    const cardBuffer = Buffer.from(cardScreenshot.data, "base64");
    const cardPath = path.join(ARTIFACTS_DIR, "step_a_1440x900_next_event_card.png");
    fs.writeFileSync(cardPath, cardBuffer);
    console.log("Saved 1440x900 next event card screenshot to:", cardPath);

    // Also capture mobile card at 375x800
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 800,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await cdp.send("Runtime.evaluate", {
      expression: `window.scrollTo(0, document.getElementById('upcoming').offsetTop);`,
    });
    await sleep(500);
    const mobileCardShot = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, "step_a_375x800_next_event_card.png"), Buffer.from(mobileCardShot.data, "base64"));

    cdp.close();
    console.log("=== VIEWPORT AUDIT COMPLETE ===");
  } finally {
    edgeProc.kill();
  }
}

runViewportAudit().catch((err) => {
  console.error("Viewport audit error:", err);
  process.exit(1);
});
