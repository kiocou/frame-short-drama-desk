import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.addInitScript(() => {
  const snapshot = { tasks: [], config: {}, output_dir: "C:\\media", running: false, paused: false };
  window.__startCalls = 0;
  window.__snapshotCalls = 0;
  window.__TAURI_INTERNALS__ = {
    invoke: async (_command, args) => {
      if (args?.action === "snapshot") {
        window.__snapshotCalls += 1;
        if (window.__snapshotCalls > 1) await new Promise((resolve) => setTimeout(resolve, 700));
        return snapshot;
      }
      if (args?.action === "start") {
        window.__startCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 1200));
        snapshot.running = true;
        return { started: true };
      }
      return null;
    },
    convertFileSrc: (path, protocol = "asset") => `${protocol}://localhost/${encodeURIComponent(path)}`,
  };
});

try {
  await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
  await page.locator('[data-view="tasks"]').first().click();
  const start = page.locator('[data-action="start"]');
  await start.click();
  const clickedAt = Date.now();
  await page.waitForTimeout(80);

  const immediate = await page.evaluate(() => ({
    label: document.querySelector('[data-action="start"]')?.textContent?.trim(),
    disabled: document.querySelector('[data-action="start"]')?.disabled,
    engine: document.querySelector(".engine-pill")?.textContent?.trim(),
    calls: window.__startCalls,
  }));
  if (immediate.label !== "启动中" || !immediate.disabled || immediate.engine !== "ENGINE STARTING" || immediate.calls !== 1) {
    throw new Error(`Start feedback was not immediate: ${JSON.stringify(immediate)}`);
  }

  await page.waitForFunction(() => document.querySelector(".engine-pill")?.textContent?.trim() === "ENGINE RUNNING", null, { timeout: 2500 });
  const runningAfterMs = Date.now() - clickedAt;
  if (runningAfterMs > 1550) throw new Error(`Running state waited for the follow-up snapshot: ${runningAfterMs}ms`);
  if (await page.evaluate(() => window.__startCalls) !== 1) throw new Error("Start was invoked more than once");
  console.log("start-feedback", JSON.stringify({ ...immediate, runningAfterMs }));
} finally {
  await browser.close();
}
