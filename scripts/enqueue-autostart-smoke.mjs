import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.addInitScript(() => {
  const snapshot = { tasks: [], config: {}, output_dir: "C:\\media", running: false, paused: false };
  window.__queueActions = [];
  window.__TAURI_INTERNALS__ = {
    invoke: async (_command, args) => {
      const action = args?.action;
      if (action !== "snapshot" && action !== "hydrate-covers") window.__queueActions.push(action);
      if (action === "snapshot") return snapshot;
      if (action === "search") {
        return { items: [{
          title: "自动下载测试剧", source: "红果短剧官网", episodes: "全2集",
          drama_id: "auto-start-series", source_url: "https://example.test/detail",
          cover_url: "data:image/png;base64,iVBORw0KGgo=",
        }] };
      }
      if (action === "enqueue") {
        snapshot.tasks = [{
          title: "自动下载测试剧 第1集", series_title: "自动下载测试剧",
          series_id: "auto-start-series", episode: 1, episode_total: 2,
          status: "等待", msg: "等待下载",
        }];
        return { added: 2, errors: [] };
      }
      if (action === "start") {
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
  await page.locator('[data-view="search"]').first().click();
  await page.locator('[data-action="search"]').click();
  await page.locator(".result-card").waitFor({ state: "visible" });
  await page.locator(".result-card").first().click();
  await page.waitForFunction(() => window.__queueActions.includes("start"), null, { timeout: 1500 });

  const result = await page.evaluate(() => ({
    actions: window.__queueActions,
    engine: document.querySelector(".engine-pill")?.textContent?.trim(),
  }));
  const enqueueIndex = result.actions.indexOf("enqueue");
  const startIndex = result.actions.indexOf("start");
  if (enqueueIndex < 0 || startIndex <= enqueueIndex) {
    throw new Error(`Expected enqueue before start: ${JSON.stringify(result)}`);
  }
  if (result.engine !== "ENGINE RUNNING") {
    throw new Error(`Download engine did not enter running state: ${JSON.stringify(result)}`);
  }
  console.log("enqueue-autostart", JSON.stringify(result));
} finally {
  await browser.close();
}
