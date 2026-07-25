import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.addInitScript(() => {
  const snapshot = { tasks: [], config: {}, output_dir: "C:\\media", running: false, paused: false };
  window.__TAURI_INTERNALS__ = {
    invoke: async (_command, args) => {
      if (args?.action === "snapshot") return snapshot;
      if (args?.action === "search") {
        return { items: [{
          title: "错误提示测试剧", source: "红果短剧官网", episodes: "全1集",
          drama_id: "error-series", source_url: "https://example.test/detail",
          cover_url: "data:image/png;base64,iVBORw0KGgo=",
        }] };
      }
      if (args?.action === "enqueue") {
        return { added: 0, errors: ["加载下载任务失败：测试错误"] };
      }
      return null;
    },
    convertFileSrc: (path, protocol = "asset") => `${protocol}://localhost/${encodeURIComponent(path)}`,
  };
});

page.on("dialog", (dialog) => dialog.dismiss());

try {
  await page.goto("http://localhost:1420", { waitUntil: "networkidle" });
  await page.locator('[data-view="search"]').first().click();
  await page.locator('[data-action="search"]').click();
  await page.locator(".result-card").first().click();

  const notice = page.locator(".app-notice");
  await notice.waitFor({ state: "visible", timeout: 1500 });
  if (!((await notice.textContent()) || "").includes("加载下载任务失败：测试错误")) {
    throw new Error(`Persistent notice lost the backend error: ${await notice.textContent()}`);
  }

  await page.locator('[data-view="search"]').first().click();
  if (!await notice.isVisible()) throw new Error("Notice disappeared after switching views");

  await notice.locator("[data-dismiss-notice]").click();
  await notice.waitFor({ state: "detached" });
  console.log("queue-error-persistence ok");
} finally {
  await browser.close();
}
