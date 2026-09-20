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

async function runStepBAudit() {
  console.log("=== RUNNING STEP B AUDIT ===");

  const port = 9223;
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

    // 1. Audit /events
    await cdp.send("Page.navigate", { url: "http://localhost:3000/events" });
    await sleep(2000);

    const widths = [320, 375, 768, 1024, 1366, 1440, 1920];
    const eventsResults: any[] = [];

    for (const w of widths) {
      const h = w === 1440 ? 900 : 800;
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile: w < 768,
      });
      await sleep(200);

      const evalRes = await cdp.send("Runtime.evaluate", {
        expression: `({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth,
        })`,
        returnByValue: true,
      });
      eventsResults.push({ page: "/events", width: w, ...evalRes.result?.value });
    }

    console.log("Viewport audit for /events:");
    console.table(eventsResults);

    // Scroll to archive section and screenshot
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const archive = document.getElementById('archive');
        if (archive) {
          archive.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      })()`,
    });
    await sleep(600);

    const archiveShot = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, "step_b_archive_accordion.png"),
      Buffer.from(archiveShot.data, "base64")
    );
    console.log("Saved archive screenshot: step_b_archive_accordion.png");

    // 2. Audit content rules on /events
    const contentCheck = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const html = document.documentElement.innerHTML;
        return {
          hasConstellation: /constellation/i.test(document.title) || (document.querySelector('h1, h2, h3') && /constellation/i.test(document.body.innerText)),
          hasArchiveHeader: html.includes("Past Events Archive"),
          searchHiddenWhenLe8: document.querySelector('input[placeholder*="Search archive"]') === null,
        };
      })()`,
      returnByValue: true,
    });
    console.log("/events Content Audit:", contentCheck.result?.value);

    // 3. Audit /events/[slug] (annual-ideathon-showcase)
    console.log("Navigating to /events/annual-ideathon-showcase...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/events/annual-ideathon-showcase" });
    await sleep(2000);

    const slugResults: any[] = [];
    for (const w of widths) {
      const h = w === 1440 ? 900 : 800;
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile: w < 768,
      });
      await sleep(200);

      const evalRes = await cdp.send("Runtime.evaluate", {
        expression: `({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth,
        })`,
        returnByValue: true,
      });
      slugResults.push({ page: "/events/[slug]", width: w, ...evalRes.result?.value });
    }

    console.log("Viewport audit for /events/[slug]:");
    console.table(slugResults);

    // Capture desktop and mobile screenshot of /events/[slug]
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(300);
    const slugShotDesktop = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, "step_b_1440x900_event_detail.png"), Buffer.from(slugShotDesktop.data, "base64"));
    console.log("Saved /events/[slug] desktop screenshot: step_b_1440x900_event_detail.png");

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 800,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await sleep(300);
    const slugShotMobile = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, "step_b_375x800_event_detail.png"), Buffer.from(slugShotMobile.data, "base64"));
    console.log("Saved /events/[slug] mobile screenshot: step_b_375x800_event_detail.png");

    cdp.close();
    console.log("=== STEP B AUDIT COMPLETE ===");
  } finally {
    edgeProc.kill();
  }
}

runStepBAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
