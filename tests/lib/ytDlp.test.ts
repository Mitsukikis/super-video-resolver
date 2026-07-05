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

  it("maps Bilibili split and combined formats into the unified manifest model", () => {
    const manifest = convertYtDlpInfoToManifest(
      {
        title: "Bilibili Fixture",
        uploader: "Fixture Uploader",
        duration: 60,
        thumbnail: "https://i0.hdslb.com/bfs/archive/fixture.jpg",
        formats: [
          {
            format_id: "80",
            url: "https://upos.example.com/combined.mp4",
            ext: "mp4",
            vcodec: "avc1.640028",
            acodec: "mp4a.40.2",
            width: 1920,
            height: 1080,
            fps: 30,
            tbr: 2800,
            filesize_approx: 21000000
          },
          {
            format_id: "64",
            url: "https://upos.example.com/video.m4s",
            ext: "mp4",
            vcodec: "avc1.64001f",
            acodec: "none",
            width: 1280,
            height: 720,
            fps: 30,
            tbr: 1600,
            filesize_approx: 12000000
          },
          {
            format_id: "30280",
            url: "https://upos.example.com/audio.m4s",
            ext: "m4a",
            vcodec: "none",
            acodec: "mp4a.40.2",
            abr: 132,
            filesize_approx: 2000000
          }
        ]
      },
      "bilibili",
      "https://www.bilibili.com/video/BV1xx",
      false
    );

    expect(manifest.platform).toBe("bilibili");
    expect(manifest.author).toBe("Fixture Uploader");
    expect(manifest.tracks.some((track) => track.kind === "combined")).toBe(true);
    expect(manifest.tracks.some((track) => track.kind === "video")).toBe(true);
    expect(manifest.tracks.some((track) => track.kind === "audio")).toBe(true);
    expect(manifest.variants.some((variant) => variant.action === "direct-save")).toBe(true);
    expect(manifest.variants.some((variant) => variant.action === "browser-merge")).toBe(true);
  });

  it("turns Twitter no-video errors into a helpful platform message", () => {
    const formatted = formatYtDlpError("ERROR: [twitter] 2072701117067342056: No video could be found in this tweet");

    expect(formatted).toContain("X/Twitter");
    expect(formatted).toContain("推文里没有内嵌视频");
    expect(formatted).not.toContain("Cookie");
  });

  it("maps Twitter login and protected-account errors separately", () => {
    expect(formatYtDlpError("ERROR: [twitter] 1: This tweet is unavailable. Login required")).toContain("需要登录");
    expect(formatYtDlpError("ERROR: [twitter] 1: User has been suspended or protected")).toContain("受保护账号");
  });

  it("turns missing yt-dlp startup errors into a server configuration error", () => {
    expect(formatYtDlpError("spawn yt-dlp ENOENT")).toContain("RESOLVER_DEPENDENCY_MISSING");
  });

  it("does not treat a missing Bilibili video as a missing yt-dlp binary", () => {
    const formatted = formatYtDlpError("ERROR: [BiliBili] BV0000000000: Video not found");

    expect(formatted).toContain("Bilibili");
    expect(formatted).not.toContain("RESOLVER_DEPENDENCY_MISSING");
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

  it("maps Bilibili HTTP 412 into an actionable source policy message", () => {
    const formatted = formatYtDlpError(
      "ERROR: [BiliBili] 1HgdpBgEZi: Unable to download webpage: HTTP Error 412: Precondition Failed"
    );

    expect(formatted).toContain("Bilibili");
    expect(formatted).toContain("HTTP 412");
    expect(formatted).toContain("Cookie");
  });

  it("adds Bilibili request headers and finite retries", () => {
    const args = buildYtDlpBaseArgs("bilibili");

    expect(args).toContain("--retries");
    expect(args).toContain("--fragment-retries");
    expect(args).toContain("Referer:https://www.bilibili.com/");
    expect(args.some((arg) => arg.startsWith("User-Agent:"))).toBe(true);
  });

  it("adds X / Twitter public-request headers without requiring Cookie", () => {
    const args = buildYtDlpBaseArgs("x");

    expect(args).toContain("--retries");
    expect(args).toContain("--fragment-retries");
    expect(args).toContain("Referer:https://x.com/");
    expect(args.some((arg) => arg.startsWith("User-Agent:"))).toBe(true);
    expect(args).not.toContain("--cookies");
    expect(args.some((arg) => /^Cookie:/i.test(arg))).toBe(false);
  });

  it("maps X / Twitter mp4 variants into direct-save manifest options", () => {
    const manifest = convertYtDlpInfoToManifest(
      {
        title: "Twitter Fixture",
        uploader: "Fixture Author",
        thumbnail: "https://pbs.twimg.com/ext_tw_video_thumb/fixture.jpg",
        formats: [
          {
            format_id: "http-832",
            url: "https://video.twimg.com/ext_tw_video/fixture/pu/vid/640x360/video.mp4",
            ext: "mp4",
            protocol: "https",
            width: 640,
            height: 360,
            tbr: 832,
            filesize_approx: 3200000
          },
          {
            format_id: "http-2176",
            url: "https://video.twimg.com/ext_tw_video/fixture/pu/vid/1280x720/video.mp4",
            ext: "mp4",
            protocol: "https",
            width: 1280,
            height: 720,
            tbr: 2176,
            filesize_approx: 8400000
          }
        ]
      },
      "x",
      "https://x.com/user/status/1?s=20",
      false
    );

    expect(manifest.platform).toBe("x");
    expect(manifest.author).toBe("Fixture Author");
    expect(manifest.tracks).toHaveLength(2);
    expect(manifest.tracks.every((track) => track.kind === "combined")).toBe(true);
    expect(manifest.variants.every((variant) => variant.action === "direct-save")).toBe(true);
    expect(manifest.warnings).toHaveLength(0);
  });
});
