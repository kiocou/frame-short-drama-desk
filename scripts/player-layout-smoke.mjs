import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const screenshotDir = process.env.PLAYER_SMOKE_DIR
  || `D:/Users/kioco/Desktop/短剧/build/player-layout-smoke-${Date.now()}`;
const baseUrl = process.env.UI_BASE_URL || "http://localhost:1420";
await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  window.__windowFullscreenCalls = [];
  const tasks = Array.from({ length: 100 }, (_, index) => ({
    title: `凡人修仙之镯灵草到道祖第一季 第${index + 1}集`,
    series_title: "凡人修仙之镯灵草到道祖第一季",
    series_id: "layout-series",
    episode: index + 1,
    episode_total: 100,
    status: "完成",
    merge_status: "等待全集",
    local_path: `C:\\media\\layout-series-${index + 1}.mp4`,
  }));
  tasks.push({
    title: "第二部测试短剧",
    series_title: "第二部测试短剧",
    series_id: "layout-series-2",
    episode: 1,
    episode_total: 1,
    status: "完成",
    merge_status: "已合并",
    local_path: "C:\\media\\layout-series-2.mp4",
  });
  window.__TAURI_INTERNALS__ = {
    metadata: { currentWindow: { label: "main" } },
    invoke: async (command, args) => {
      if (command === "plugin:window|set_fullscreen") window.__windowFullscreenCalls.push(args?.value);
      return args?.action === "snapshot"
        ? { tasks, config: {}, output_dir: "C:\\media", running: false, paused: false }
        : null;
    },
    convertFileSrc: (path, protocol = "asset") => `${protocol}://localhost/${encodeURIComponent(path)}`,
  };
});

async function readLayout() {
  return page.evaluate(() => {
    const toRect = (element) => {
      const value = element?.getBoundingClientRect();
      return value ? { top: value.top, right: value.right, bottom: value.bottom, left: value.left, width: value.width, height: value.height } : null;
    };
    const content = document.querySelector(".content");
    const frame = document.querySelector(".video-frame");
    const meta = document.querySelector(".player-meta");
    const episodes = document.querySelector(".episode-strip");
    const controls = document.querySelector(".player-controls");
    const side = document.querySelector(".player-side");
    const close = document.querySelector(".panel-close");
    const libraryCount = document.querySelector(".library-title .section-count");
    const activeEpisode = episodes?.querySelector("button.active");
    const error = document.querySelector(".player-error");
    const errorProbe = error?.cloneNode();
    if (errorProbe && frame) frame.append(errorProbe);
    const emptyErrorDisplay = errorProbe ? getComputedStyle(errorProbe).display : "missing";
    errorProbe?.remove();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      content: toRect(content),
      frame: toRect(frame),
      meta: toRect(meta),
      episodes: toRect(episodes),
      controls: toRect(controls),
      side: toRect(side),
      close: toRect(close),
      libraryCount: toRect(libraryCount),
      activeEpisode: toRect(activeEpisode),
      sideVisibility: side ? getComputedStyle(side).visibility : "missing",
      sideInFrame: Boolean(frame && side && frame.contains(side)),
      episodesInSide: Boolean(side && episodes && side.contains(episodes)),
      episodesInStage: Boolean(document.querySelector(".player-stage > .episode-strip")),
      episodeCount: episodes?.querySelectorAll("button").length || 0,
      episodeScrollable: episodes ? episodes.scrollHeight > episodes.clientHeight : false,
      mediaCardCount: document.querySelectorAll(".media-card").length,
      playQueueCount: document.querySelectorAll(".play-queue, .play-queue-row, .queue-title").length,
      errorDisplay: error ? getComputedStyle(error).display : "missing",
      emptyErrorDisplay,
    };
  });
}

function assertComplete(layout, label) {
  if (!layout.content || !layout.frame || !layout.meta || !layout.episodes || !layout.controls || !layout.side) {
    throw new Error(`${label}: player layout is missing: ${JSON.stringify(layout)}`);
  }
  if (layout.documentScrollWidth > layout.viewport.width + 1) {
    throw new Error(`${label}: horizontal overflow: ${JSON.stringify(layout)}`);
  }
  for (const [name, bounds] of [["frame", layout.frame], ["meta", layout.meta], ["controls", layout.controls]]) {
    if (bounds.left < layout.content.left - 1 || bounds.right > layout.content.right + 1 || bounds.top < layout.content.top - 1 || bounds.bottom > layout.content.bottom + 1) {
      throw new Error(`${label}: ${name} is clipped: ${JSON.stringify(layout)}`);
    }
  }
  if (layout.frame.height < 240 || layout.episodeCount !== 100 || !layout.episodesInSide || layout.episodesInStage
    || !layout.sideInFrame || layout.mediaCardCount !== 2 || layout.playQueueCount !== 0 || layout.emptyErrorDisplay !== "none") {
    throw new Error(`${label}: player sizing or episode navigation failed: ${JSON.stringify(layout)}`);
  }
  if (layout.sideVisibility !== "hidden") {
    throw new Error(`${label}: closed media panel remains visible: ${JSON.stringify(layout)}`);
  }
}

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator('[data-view="player"]').first().click();
  await page.locator(".player-library-button").click();
  await page.locator('.media-card [data-player-action="play-series"]').first().click();
  await page.locator("#player-video").waitFor({ state: "attached" });
  await page.locator("#player-video").evaluate((video) => video.dispatchEvent(new Event("playing")));
  await page.locator(".panel-close").click();
  await page.waitForTimeout(320);

  const standard = await readLayout();
  assertComplete(standard, "1280x800");
  await page.screenshot({ path: `${screenshotDir}/player-1280x800.png`, fullPage: false });

  await page.locator(".player-library-button").click();
  await page.waitForTimeout(320);
  const openPanel = await readLayout();
  if (openPanel.sideVisibility !== "visible" || !openPanel.side || openPanel.side.left < openPanel.frame.left || openPanel.side.right > openPanel.frame.right + 1
    || openPanel.side.top < openPanel.frame.top || openPanel.side.bottom > openPanel.frame.bottom + 1) {
    throw new Error(`1280x800: media panel is clipped when open: ${JSON.stringify(openPanel)}`);
  }
  if (!openPanel.episodes || openPanel.episodes.left < openPanel.side.left || openPanel.episodes.right > openPanel.side.right
    || openPanel.episodes.top < openPanel.side.top || openPanel.episodes.bottom > openPanel.side.bottom
    || !openPanel.episodeScrollable) {
    throw new Error(`1280x800: episode selector is not contained and scrollable in the media panel: ${JSON.stringify(openPanel)}`);
  }
  if (!openPanel.close || !openPanel.libraryCount
    || openPanel.libraryCount.right > openPanel.close.left - 8) {
    throw new Error(`1280x800: library count overlaps the close button: ${JSON.stringify(openPanel)}`);
  }
  await page.screenshot({ path: `${screenshotDir}/player-panel-open.png`, fullPage: false });
  await page.locator(".panel-close").click();
  await page.waitForTimeout(320);

  await page.setViewportSize({ width: 1995, height: 1248 });
  await page.locator('[data-player-action="fullscreen"]').click();
  await page.waitForTimeout(80);
  const fullscreen = await page.evaluate(() => {
    const frame = document.querySelector(".video-frame")?.getBoundingClientRect();
    const controls = document.querySelector(".player-controls")?.getBoundingClientRect();
    const episodePicker = document.querySelector(".fullscreen-episode-picker");
    const error = document.querySelector(".player-error");
    return {
      viewport: { width: innerWidth, height: innerHeight },
      bodyFullscreen: document.body.classList.contains("player-fullscreen"),
      frameIsFullscreenElement: document.fullscreenElement?.classList.contains("video-frame") || false,
      nativeWindowFullscreenCalls: [...window.__windowFullscreenCalls],
      frame: frame ? { top: frame.top, right: frame.right, bottom: frame.bottom, left: frame.left, width: frame.width, height: frame.height } : null,
      controls: controls ? { top: controls.top, right: controls.right, bottom: controls.bottom, left: controls.left } : null,
      episodePickerDisplay: episodePicker ? getComputedStyle(episodePicker).display : "missing",
      episodePickerCount: episodePicker?.querySelectorAll('[data-player-action="play-episode"]').length || 0,
      emptyErrorDisplay: (() => {
        if (!error) return "missing";
        const probe = error.cloneNode();
        document.fullscreenElement?.append(probe);
        const display = getComputedStyle(probe).display;
        probe.remove();
        return display;
      })(),
      position: getComputedStyle(document.querySelector(".video-frame")).position,
    };
  });
  if (!fullscreen.bodyFullscreen || !fullscreen.frameIsFullscreenElement || !fullscreen.frame
    || Math.abs(fullscreen.frame.top) > 1 || Math.abs(fullscreen.frame.left) > 1
    || Math.abs(fullscreen.frame.right - fullscreen.viewport.width) > 1
    || Math.abs(fullscreen.frame.bottom - fullscreen.viewport.height) > 1
    || fullscreen.nativeWindowFullscreenCalls.at(-1) !== true
    || fullscreen.episodePickerCount !== 0 || fullscreen.episodePickerDisplay !== "missing"
    || fullscreen.emptyErrorDisplay !== "none" || !fullscreen.controls) {
    throw new Error(`Fullscreen player does not cover the viewport: ${JSON.stringify(fullscreen)}`);
  }
  await page.screenshot({ path: `${screenshotDir}/player-fullscreen.png`, fullPage: false });

  await page.locator(".panel-toggle").click();
  await page.waitForTimeout(320);
  const fullscreenPanel = await readLayout();
  if (fullscreenPanel.sideVisibility !== "visible" || !fullscreenPanel.sideInFrame || !fullscreenPanel.side || !fullscreenPanel.frame
    || fullscreenPanel.side.left < fullscreenPanel.frame.left || fullscreenPanel.side.right > fullscreenPanel.frame.right + 1
    || fullscreenPanel.side.top < fullscreenPanel.frame.top || fullscreenPanel.side.bottom > fullscreenPanel.frame.bottom + 1) {
    throw new Error(`Fullscreen media panel is unavailable or clipped: ${JSON.stringify(fullscreenPanel)}`);
  }
  await page.screenshot({ path: `${screenshotDir}/player-fullscreen-panel.png`, fullPage: false });
  await page.locator('.media-card [data-player-action="play-series"]').nth(1).click();
  await page.waitForTimeout(120);
  const fullscreenSeriesSwitch = await page.evaluate(() => ({
    remainsFullscreen: document.fullscreenElement?.classList.contains("video-frame") || false,
    activeTitle: document.querySelector(".media-card.active b")?.textContent || "",
    currentTitle: document.querySelector(".now-playing b")?.textContent || "",
  }));
  if (!fullscreenSeriesSwitch.remainsFullscreen || fullscreenSeriesSwitch.activeTitle !== "第二部测试短剧"
    || fullscreenSeriesSwitch.currentTitle !== "第二部测试短剧") {
    throw new Error(`Switching series left fullscreen or desynchronized the library: ${JSON.stringify(fullscreenSeriesSwitch)}`);
  }
  await page.locator('.media-card [data-player-action="play-series"]').first().click();
  await page.waitForTimeout(120);
  await page.locator('.episode-strip [data-episode-index="36"]').click();
  await page.waitForTimeout(120);
  const fullscreenEpisodeSwitch = await page.evaluate(() => ({
    remainsFullscreen: document.fullscreenElement?.classList.contains("video-frame") || false,
    activeIndexes: [...document.querySelectorAll('[data-player-action="play-episode"].active')].map((button) => button.dataset.episodeIndex),
    currentLabel: document.querySelector(".now-playing span")?.textContent || "",
  }));
  if (!fullscreenEpisodeSwitch.remainsFullscreen
    || fullscreenEpisodeSwitch.activeIndexes.length !== 1
    || fullscreenEpisodeSwitch.activeIndexes.some((index) => index !== "36")
    || fullscreenEpisodeSwitch.currentLabel !== "EPISODE 37") {
    throw new Error(`Selecting an episode leaves fullscreen or desynchronizes selection: ${JSON.stringify(fullscreenEpisodeSwitch)}`);
  }
  await page.screenshot({ path: `${screenshotDir}/player-fullscreen-episode-37.png`, fullPage: false });
  await page.locator(".panel-close").click();
  await page.waitForTimeout(320);
  await page.locator('[data-player-action="fullscreen"]').click();
  await page.waitForTimeout(80);
  const fullscreenExit = await page.evaluate(() => ({
    elementExited: !document.fullscreenElement,
    bodyExited: !document.body.classList.contains("player-fullscreen"),
    nativeWindowFullscreenCalls: [...window.__windowFullscreenCalls],
  }));
  if (!fullscreenExit.elementExited || !fullscreenExit.bodyExited
    || fullscreenExit.nativeWindowFullscreenCalls.at(-1) !== false) {
    throw new Error(`Fullscreen exit did not restore the native window: ${JSON.stringify(fullscreenExit)}`);
  }

  await page.setViewportSize({ width: 1040, height: 680 });
  const compact = await readLayout();
  assertComplete(compact, "1040x680");
  await page.screenshot({ path: `${screenshotDir}/player-1040x680.png`, fullPage: false });

  await page.locator(".player-library-button").click();
  await page.waitForTimeout(320);
  const compactOpen = await readLayout();
  if (compactOpen.sideVisibility !== "visible" || !compactOpen.side || !compactOpen.episodes
    || compactOpen.side.left < compactOpen.content.left || compactOpen.side.right > compactOpen.content.right + 1
    || compactOpen.episodes.left < compactOpen.side.left || compactOpen.episodes.right > compactOpen.side.right
    || compactOpen.episodes.top < compactOpen.side.top || compactOpen.episodes.bottom > compactOpen.side.bottom) {
    throw new Error(`1040x680: media panel or episode selector is clipped: ${JSON.stringify(compactOpen)}`);
  }
  if (!compactOpen.activeEpisode || compactOpen.activeEpisode.top < compactOpen.episodes.top
    || compactOpen.activeEpisode.bottom > compactOpen.episodes.bottom) {
    throw new Error(`1040x680: current episode is not revealed when the media panel opens: ${JSON.stringify(compactOpen)}`);
  }
  await page.screenshot({ path: `${screenshotDir}/player-panel-1040x680.png`, fullPage: false });
  const lastEpisodeReachable = await page.locator(".episode-strip").evaluate((strip) => {
    strip.scrollTop = strip.scrollHeight;
    const last = strip.lastElementChild?.getBoundingClientRect();
    const bounds = strip.getBoundingClientRect();
    return Boolean(last && last.bottom <= bounds.bottom + 1 && last.top >= bounds.top - 1);
  });
  if (!lastEpisodeReachable) throw new Error("Episode 100 is not reachable in the media-panel selector");

  console.log(JSON.stringify({ standard, openPanel, fullscreen, fullscreenPanel, fullscreenSeriesSwitch, fullscreenEpisodeSwitch, fullscreenExit, compact, compactOpen, screenshotDir }, null, 2));
} finally {
  await browser.close();
}
