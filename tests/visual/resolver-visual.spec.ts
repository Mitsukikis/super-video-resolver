import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const previewDir = join(process.cwd(), "docs", "design-v2", "universal-resolver-preview");

const successManifest = {
  sourceUrl: "https://www.youtube.com/watch?v=visual-test",
  platform: "youtube",
  title: "视觉测试夹具：公开视频资源清单",
  author: "Visual QA Fixture",
  durationSeconds: 196,
  variants: [
    {
      id: "combined-720",
      label: "720p 已合并",
      kind: "combined",
      action: "direct-save",
      combinedTrackId: "combined-720",
      width: 1280,
      height: 720,
      fps: 30,
      bitrateKbps: 1800,
      container: "mp4",
      sizeBytes: 18200000
    },
    {
      id: "split-1080-audio",
      label: "1080p 视频+音频",
      kind: "split",
      action: "browser-merge",
      videoTrackId: "video-1080",
      audioTrackId: "audio-best",
      width: 1920,
      height: 1080,
      fps: 30,
      bitrateKbps: 3200,
      container: "mp4",
      sizeBytes: 42100000
    }
  ],
  tracks: [
    {
      id: "combined-720",
      kind: "combined",
      url: "https://media.example.test/video-720.mp4",
      container: "mp4",
      codec: "avc1,mp4a",
      bitrateKbps: 1800,
      width: 1280,
      height: 720,
      fps: 30,
      sizeBytes: 18200000
    },
    {
      id: "video-1080",
      kind: "video",
      url: "https://media.example.test/video-only-1080.mp4",
      container: "mp4",
      codec: "avc1",
      bitrateKbps: 3000,
      width: 1920,
      height: 1080,
      fps: 30,
      sizeBytes: 38600000
    },
    {
      id: "audio-best",
      kind: "audio",
      url: "https://media.example.test/audio.m4a",
      container: "m4a",
      codec: "mp4a",
      bitrateKbps: 128,
      sizeBytes: 3500000
    }
  ],
  warnings: ["视觉测试夹具：该数据只用于截图，不代表真实解析结果。"],
  fallbacks: [
    {
      id: "yt-dlp",
      label: "yt-dlp 本地命令",
      command: "yt-dlp --no-playlist -f \"bv*+ba/b\" \"https://www.youtube.com/watch?v=visual-test\"",
      containsSensitiveData: false
    }
  ]
};

async function mockRuntime(page: Page) {
  await page.route("**/api/runtime", async (route) => {
    await route.fulfill({
      json: {
        resolverReady: true,
        ytDlpAvailable: true,
        ytDlpVersion: "visual-fixture",
        ffmpegAvailable: true,
        ffmpegVersion: "visual-fixture",
        tempDirectoryWritable: true,
        nodeVersion: process.version,
        platform: process.platform,
        browserMergeEnabled: true
      }
    });
  });
}

async function open(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await mockRuntime(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "万能视频解析工作台" })).toBeVisible();
}

async function resolveWith(page: Page, payload: unknown) {
  await page.route("**/api/resolve", async (route) => {
    await route.fulfill({ json: payload });
  });
  await page.locator("#video-url").fill("https://www.youtube.com/watch?v=visual-test");
  await page.getByRole("button", { name: "开始解析" }).click();
}

test.beforeAll(() => {
  mkdirSync(previewDir, { recursive: true });
});

test("desktop empty state", async ({ page }) => {
  await open(page, 1440, 1000);
  await page.screenshot({ path: join(previewDir, "desktop-empty.png") });
});

test("desktop loading state", async ({ page }) => {
  await open(page, 1440, 1000);
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/resolve", async (route) => {
    await pending;
    await route.fulfill({ json: { ok: false, error: "visual loading finished" } });
  });
  await page.locator("#video-url").fill("https://www.youtube.com/watch?v=visual-test");
  await page.getByRole("button", { name: "开始解析" }).click();
  await expect(page.getByText("当前接口没有真实百分比进度")).toBeVisible();
  await page.screenshot({ path: join(previewDir, "desktop-loading.png") });
  release();
});

test("desktop success state", async ({ page }) => {
  await open(page, 1440, 1000);
  await resolveWith(page, { ok: true, manifest: successManifest });
  await expect(page.getByText("视觉测试夹具：公开视频资源清单")).toBeVisible();
  await page.locator(".results-zone").scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(previewDir, "desktop-success.png") });
});

test("desktop error state", async ({ page }) => {
  await open(page, 1440, 1000);
  await resolveWith(page, {
    ok: false,
    error: "RESOLVER_DEPENDENCY_MISSING: 服务器尚未安装视频解析组件，请联系管理员完成配置。"
  });
  await expect(page.getByText("服务器解析组件未就绪")).toBeVisible();
  await page.screenshot({ path: join(previewDir, "desktop-error.png") });
});

test("tablet success state", async ({ page }) => {
  await open(page, 768, 1024);
  await resolveWith(page, { ok: true, manifest: successManifest });
  await page.locator(".results-zone").scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(previewDir, "tablet-success.png") });
});

test("mobile empty state", async ({ page }) => {
  await open(page, 390, 844);
  await page.screenshot({ path: join(previewDir, "mobile-empty.png") });
});

test("mobile success state", async ({ page }) => {
  await open(page, 390, 844);
  await resolveWith(page, { ok: true, manifest: successManifest });
  await page.locator(".results-zone").scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(previewDir, "mobile-success.png") });
});

test("mobile error state", async ({ page }) => {
  await open(page, 360, 800);
  await resolveWith(page, { ok: false, error: "该平台需要账号态。请先输入本站访问码" });
  await expect(page.getByText("需要平台账号态")).toBeVisible();
  await page.screenshot({ path: join(previewDir, "mobile-error.png") });
});
