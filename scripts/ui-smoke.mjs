import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const screenshotDir = process.env.UI_SMOKE_DIR || "D:/Users/kioco/Desktop/短剧/build/ui-smoke";
await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  const tasks = [
    { title: "试映短剧 第1集", series_title: "试映短剧", series_id: "play-a", episode: 1, episode_total: 2, status: "完成", merge_status: "等待全集", local_path: "C:\\media\\play-a-1.mp4" },
    { title: "试映短剧 第2集", series_title: "试映短剧", series_id: "play-a", episode: 2, episode_total: 2, status: "完成", merge_status: "等待全集", local_path: "C:\\media\\play-a-2.mp4" },
    { title: "排队短剧", series_title: "排队短剧", series_id: "play-b", episode: 1, episode_total: 60, status: "完成", merge_status: "已合并", url: "C:\\media\\play-b-full.mp4" },
  ];
  window.__TAURI_INTERNALS__ = {
    invoke: async (_command, args) => args?.action === "snapshot"
      ? { tasks, config: {}, output_dir: "C:\\media", running: false, paused: false }
      : null,
    convertFileSrc: (path, protocol = "asset") => `${protocol}://localhost/${encodeURIComponent(path)}`,
  };
});
await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
const selectionPolicy = await page.evaluate(() => ({
  body: getComputedStyle(document.body).userSelect,
  input: getComputedStyle(document.querySelector("input")).userSelect,
}));
if (selectionPolicy.body !== "none" || selectionPolicy.input !== "text") {
  throw new Error(`Unexpected text selection policy: ${JSON.stringify(selectionPolicy)}`);
}
const groupCheck = await page.evaluate(async () => {
  const { groupedTasks } = await import("/task-groups.ts");
  const groups = groupedTasks([
    { title: "测试短剧 第1集", series_title: "测试短剧", series_id: "same", episode: 1, episode_total: 2, status: "完成", merge_status: "等待全集" },
    { title: "测试短剧 第2集", series_title: "测试短剧", series_id: "same", episode: 2, episode_total: 2, status: "完成", merge_status: "已合并" },
    { title: "另一部 第1集", episode: 1, episode_total: 1, status: "等待" },
  ]);
  return groups.map((group) => ({ title: group.title, total: group.episode_total, size: group._group_size }));
});
if (groupCheck.length !== 2 || groupCheck[0].title !== "测试短剧" || groupCheck[0].total !== 2 || groupCheck[0].size !== 2) {
  throw new Error(`Task grouping failed: ${JSON.stringify(groupCheck)}`);
}
const mergedPathCheck = await page.evaluate(async () => {
  const { mediaPath } = await import("/player-queue.ts");
  return mediaPath({
    merge_status: "已合并",
    local_path: "C:\\media\\.parts\\deleted-episode.mp4",
    url: "C:\\media\\series-full.mp4",
  });
});
if (mergedPathCheck !== "C:\\media\\series-full.mp4") {
  throw new Error(`Merged playback did not prefer the full video: ${mergedPathCheck}`);
}
await page.screenshot({ path: `${screenshotDir}/frame-home.png`, fullPage: true });
await page.evaluate(() => {
  window.__TAURI_INTERNALS__ = {
    invoke: async (_command, args) => {
      if (args?.action === "search") {
        await new Promise((resolve) => setTimeout(resolve, 350));
        return { items: [{ title: "真实封面测试", source: "红果短剧官网", episodes: "全2集", category: "测试", drama_id: "cover-test", cover_url: "" }] };
      }
      if (args?.action === "hydrate-covers") {
        await new Promise((resolve) => setTimeout(resolve, 650));
        return { items: [{ drama_id: "cover-test", cover_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", cover_path: "" }] };
      }
      return null;
    },
  };
});
await page.locator('[data-view="search"]').first().click();
await page.locator('[data-action="search"]').click();
await page.locator(".search-loading").waitFor({ state: "visible" });
if (!await page.locator('[data-action="search"]').isDisabled()) throw new Error("Search button must be disabled while loading");
await page.locator(".search-loading").waitFor({ state: "detached", timeout: 2000 });
if (await page.locator(".search-results .result-card").count() !== 1) throw new Error("Search results were blocked by cover hydration");
if (await page.locator(".search-results .poster.has-cover img").count()) throw new Error("Cover hydration unexpectedly blocked the initial search result");
await page.locator(".search-results .poster.has-cover img").waitFor({ state: "visible", timeout: 2000 });
const views = ["search", "tasks", "player", "settings", "home"];
for (const view of views) {
  await page.locator(`[data-view="${view}"]`).first().click();
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${screenshotDir}/frame-${view}.png`, fullPage: true });
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  console.log(view, JSON.stringify(layout));
}
await page.locator('[data-view="tasks"]').first().click();
if (await page.locator(".queue-row").count() !== await page.locator(".delete-series").count()) {
  throw new Error("Every queue series must have one delete button");
}
await page.locator(".queue-row").first().dblclick();
if (await page.locator(".task-detail-drawer").count() !== 1) throw new Error("Double-click did not open task details");
if (await page.locator(".episode-detail-row").count() !== 2) throw new Error("Task details do not show every episode");
await page.waitForTimeout(350);
await page.screenshot({ path: `${screenshotDir}/frame-task-detail.png`, fullPage: false });
await page.locator(".task-detail-header [data-close-task-detail]").click();
if (await page.locator(".task-detail-drawer").count()) throw new Error("Task detail drawer did not close");

await page.locator('[data-view="player"]').first().click();
if (await page.locator(".media-card").count() !== 2) throw new Error("Playable series were not grouped correctly");
if (await page.locator(".play-queue, .play-queue-row, .queue-title").count()) throw new Error("Media library and playlist were not merged");
await page.locator('.media-card [data-player-action="play-series"]').first().evaluate((button) => button.click());
if (await page.locator("#player-video").count() !== 1) throw new Error("Selected series did not open in the player");
if (await page.locator(".episode-strip button").count() !== 2) throw new Error("Episode order was not rendered");
await page.waitForTimeout(500);
await page.screenshot({ path: `${screenshotDir}/frame-player-queued.png`, fullPage: false });
const fullscreenCheck = await page.evaluate(async () => {
  const frame = document.querySelector(".video-frame");
  const video = document.querySelector("#player-video");
  const button = document.querySelector('[data-player-action="fullscreen"]');
  if (!(frame instanceof HTMLElement) || !(video instanceof HTMLVideoElement) || !(button instanceof HTMLButtonElement)) {
    return { ready: false };
  }
  Object.defineProperty(video, "paused", { configurable: true, get: () => false });
  Object.defineProperty(video, "ended", { configurable: true, get: () => false });
  Object.defineProperty(video, "videoWidth", { configurable: true, get: () => 1920 });
  Object.defineProperty(video, "videoHeight", { configurable: true, get: () => 1080 });
  video.dispatchEvent(new Event("loadedmetadata"));
  video.dispatchEvent(new Event("playing"));
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 2400));
  const hidden = frame.classList.contains("player-ui-hidden");
  const fit = getComputedStyle(video).objectFit;
  document.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 50));
  const revealed = !frame.classList.contains("player-ui-hidden");
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { ready: true, hidden, revealed, fit, exited: !document.body.classList.contains("player-fullscreen") };
});
if (!fullscreenCheck.ready || !fullscreenCheck.hidden || !fullscreenCheck.revealed || fullscreenCheck.fit !== "cover" || !fullscreenCheck.exited) {
  throw new Error(`Fullscreen player behavior failed: ${JSON.stringify(fullscreenCheck)}`);
}

await page.locator('[data-view="search"]').first().click();
const scrollCheck = await page.evaluate(() => {
  const panel = document.querySelector(".search-results .result-grid");
  const row = panel?.querySelector(".result-card") || document.createElement("button");
  row.className = "result-card";
  row.innerHTML = "<div class='result-card-cover'><span class='poster'>测</span><span class='result-ep-badge'>80集</span></div><div class='result-card-body'><b class='result-card-title'>滚动测试短剧</b><span class='result-card-meta'>公开来源</span></div>";
  for (let index = 0; index < 50; index += 1) panel?.append(row.cloneNode(true));
  const content = document.querySelector(".content");
  if (!(content instanceof HTMLElement)) return { scrollable: false, moved: false };
  const scrollable = content.scrollHeight > content.clientHeight;
  content.scrollTop = content.scrollHeight;
  return { scrollable, moved: content.scrollTop > 0, scrollTop: content.scrollTop };
});
console.log("search-scroll", JSON.stringify(scrollCheck));
if (!scrollCheck.scrollable || !scrollCheck.moved) throw new Error("Search results cannot scroll");
await page.waitForTimeout(450);
const lastRowVisible = await page.locator(".search-results .result-card").last().evaluate((row) => {
  const rect = row.getBoundingClientRect();
  return rect.bottom > 46 && rect.top < window.innerHeight;
});
if (!lastRowVisible) throw new Error("Last search result is not reachable");
await page.screenshot({ path: `${screenshotDir}/frame-search-scroll.png`, fullPage: false });
await page.setViewportSize({ width: 1040, height: 680 });
await page.locator('[data-view="player"]').first().click();
await page.waitForTimeout(500);
const compactPlayer = await page.evaluate(() => ({
  viewport: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}));
console.log("player-compact", JSON.stringify(compactPlayer));
if (compactPlayer.overflow) throw new Error("Player overflows at the minimum desktop width");
await page.screenshot({ path: `${screenshotDir}/frame-player-compact.png`, fullPage: false });
await browser.close();
