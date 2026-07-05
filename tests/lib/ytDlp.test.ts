import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildYtDlpBaseArgs, convertYtDlpInfoToManifest, formatYtDlpError } from "@/lib/resolvers/ytDlp";

describe("convertYtDlpInfoToManifest", () => {
  it("creates combined and split variants", () => {
    const info = JSON.parse(readFileSync("tests/fixtures/yt-dlp-youtube.json", "utf8"));
    const manifest = convertYtDlpInfoToManifest(info, "youtube", "https://www.youtube.com/watch?v=abc", false);

    expect(manifest.title).toBe("Fixture Video");
    expect(manifest.tracks.some((track) => track.kind === "combined")).toBe(true);
    expect(manifest.variants.some((variant) => variant.action === "browser-merge")).toBe(true);
    expect(manifest.fallbacks.some((fallback) => fallback.id === "yt-dlp")).toBe(true);
  });

  it("normalizes null numeric fields from yt-dlp", () => {
    const manifest = convertYtDlpInfoToManifest(
      {
        title: "Null fields",
        formats: [
          {
            format_id: "audio-null",
            url: "https://media.example/audio.m4a",
            ext: "m4a",
            vcodec: "none",
            acodec: "mp4a",
            width: null,
            height: null,
            fps: null,
            filesize: null
          }
        ]
      },
      "youtube",
      "https://www.youtube.com/watch?v=abc",
      false
    );

    expect(manifest.tracks[0].width).toBeUndefined();
    expect(manifest.tracks[0].sizeBytes).toBeUndefined();
  });

  it("turns Twitter no-video errors into a helpful platform message", () => {
    expect(formatYtDlpError("ERROR: [twitter] 2072701117067342056: No video could be found in this tweet")).toContain(
      "X/Twitter"
    );
  });

  it("turns missing yt-dlp startup errors into a server configuration error", () => {
    expect(formatYtDlpError("spawn yt-dlp ENOENT")).toContain("RESOLVER_DEPENDENCY_MISSING");
  });

  it("does not expose Python warning paths in parser errors", () => {
    const formatted = formatYtDlpError(
      "C:\\Users\\35559\\AppData\\Local\\Programs\\Python\\Python312\\Lib\\site-packages\\requests\\__init__.py:113: RequestsDependencyWarning: dependency mismatch\r\n" +
        "  warnings.warn(\r\n" +
        "ERROR: [youtube] abc123: Video unavailable"
    );

    expect(formatted).toBe("ERROR: [youtube] abc123: Video unavailable");
    expect(formatted).not.toContain("C:\\Users");
    expect(formatted).not.toContain("RequestsDependencyWarning");
  });

  it("maps Bilibili HTTP 412 as public source policy blocking, not a default Cookie requirement", () => {
    const formatted = formatYtDlpError(
      "ERROR: [BiliBili] 1GJ411x7h7: Unable to download JSON metadata: HTTP Error 412: Precondition Failed"
    );

    expect(formatted).toContain("Bilibili");
    expect(formatted).toContain("HTTP 412");
    expect(formatted).toContain("公开视频");
    expect(formatted).toContain("源站策略");
    expect(formatted).not.toContain("请提供 Cookie");
  });

  it("maps Bilibili b23 short-link expansion failures separately", () => {
    const formatted = formatYtDlpError("ERROR: [BiliBili] b23.tv short URL redirect failed: HTTP Error 404: Not Found");

    expect(formatted).toContain("b23.tv");
    expect(formatted).toContain("短链");
  });

  it("maps Bilibili invalid Cookie and high-quality login cases separately", () => {
    expect(formatYtDlpError("ERROR: [BiliBili] invalid SESSDATA cookie")).toContain("Cookie 可能已失效");
    expect(formatYtDlpError("ERROR: [BiliBili] Login is required for 1080P high quality formats")).toContain("高画质");
  });

  it("adds Bilibili public request headers without requiring Cookie", () => {
    const args = buildYtDlpBaseArgs("bilibili");

    expect(args).toContain("--retries");
    expect(args).toContain("--fragment-retries");
    expect(args).toContain("Referer:https://www.bilibili.com/");
    expect(args).toContain("Origin:https://www.bilibili.com");
    expect(args.some((arg) => arg.startsWith("User-Agent:"))).toBe(true);
    expect(args).not.toContain("--cookies");
    expect(args.some((arg) => /^Cookie:/i.test(arg))).toBe(false);
  });
});
