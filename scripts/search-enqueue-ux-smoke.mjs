import { chromium } from "playwright";

// Search → enqueue UX: stay on the search page, toast feedback, dedup guard,
// and a persistent "added" mark on the card. Replaces the old jump-to-queue +
// window.alert flow.
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.addInitScript(() => {
  const snapshot = { tasks: [], config: {}, output_dir: "C:\\media", running: false, paused: false };
  window.__acts = [];
  window.__TAURI_INTERNALS__ = {
    invoke: async (_cmd, args) => {
      const a = args?.action;
      window.__acts.push(a);
      if (a === "snapshot") return snapshot;
      if (a === "hydrate-covers") return { items: [] };
      if (a === "search") {
        return { items: [
          { title: "搜索入队测试剧", drama_id: "search-enqueue-series", episodes: "全2集", source: "红果短剧官网", source_url: "https://example.test/detail?series_id=search-enqueue-series" },
        ] };
      }
      if (a === "enqueue") {
        const item = args?.payload?.item || {};
        const sid = String(item.drama_id || args?.payload?.raw || "");
        if (snapshot.tasks.some((t) => String(t.series_id) === sid)) return { added: 0, errors: [] };
        snapshot.tasks = snapshot.tasks.concat([{
          title: "搜索入队测试剧 第1集", series_title: "搜索入队测试剧",
          series_id: sid, episode: 1, episode_total: 2, id: "v1", status: "等待", msg: "等待下载",
        }]);
        return { added: 2, errors: [] };
      }
      if (a === "start") { snapshot.running = true; return { started: true }; }
      return null;
    },
    convertFileSrc: (path, protocol = "asset") => `${protocol}://localhost/${encodeURIComponent(path)}`,
  };
});

// The optimized flow must not use window.alert.
page.on("dialog", (dialog) => {
  throw new Error(`window.alert was used (should be a toast): ${dialog.message()}`);
});

try {
  await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
  await page.locator('[data-view="search"]').first().click();
  await page.locator("#search-keyword").fill("入队");
  await page.locator('[data-action="search"]').click();
  await page.locator(".result-card").first().waitFor({ state: "visible", timeout: 3000 });

  // 1) Click card → success toast, card marked added, stay on search view.
  await page.locator(".result-card").first().click();
  await page.waitForFunction(
    () => document.querySelector(".app-notice")?.textContent?.includes("已加入"),
    null, { timeout: 2500 }
  );
  const afterAdd = await page.evaluate(() => ({
    jumpedToQueue: document.querySelector(".queue-panel") !== null,
    notice: document.querySelector(".app-notice")?.textContent?.trim() || "",
    addedMark: document.querySelector(".result-card")?.classList.contains("is-added"),
  }));
  if (afterAdd.jumpedToQueue) throw new Error("Jumped away from search page on enqueue");
  if (!afterAdd.notice.includes("已加入")) throw new Error(`No success toast: ${afterAdd.notice}`);
  if (!afterAdd.addedMark) throw new Error("Card not marked is-added");

  // 2) Click the same card again → "already in queue" toast, no duplicate enqueue.
  const enqueueBefore = await page.evaluate(() => window.__acts.filter((a) => a === "enqueue").length);
  await page.locator(".result-card").first().click();
  await page.waitForFunction(
    () => document.querySelector(".app-notice")?.textContent?.includes("已在下载队列"),
    null, { timeout: 2500 }
  );
  const enqueueAfter = await page.evaluate(() => window.__acts.filter((a) => a === "enqueue").length);
  if (enqueueAfter !== enqueueBefore) throw new Error("Duplicate enqueue fired for an already-queued series");

  console.log("search-enqueue-ux", JSON.stringify({ toast: afterAdd.notice, added: afterAdd.addedMark }));
} finally {
  await browser.close();
}
