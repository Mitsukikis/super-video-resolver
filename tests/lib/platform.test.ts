import { describe, expect, it } from "vitest";
import { detectPlatform, isTwitterStatusUrl, normalizeInputUrl, normalizePlatformUrl } from "@/lib/platform";

describe("platform detection", () => {
  it("detects youtube, bilibili, and x links", () => {
    expect(detectPlatform(new URL("https://www.youtube.com/watch?v=abc"))).toBe("youtube");
    expect(detectPlatform(new URL("https://youtu.be/abc"))).toBe("youtube");
    expect(detectPlatform(new URL("https://www.bilibili.com/video/BV1xx"))).toBe("bilibili");
    expect(detectPlatform(new URL("https://www.bilibili.com/video/av80433022"))).toBe("bilibili");
    expect(detectPlatform(new URL("https://b23.tv/BV1GJ411x7h7"))).toBe("bilibili");
    expect(detectPlatform(new URL("https://x.com/user/status/1"))).toBe("x");
    expect(detectPlatform(new URL("https://twitter.com/user/status/1"))).toBe("x");
    expect(detectPlatform(new URL("https://mobile.twitter.com/user/status/1?s=20"))).toBe("x");
  });

  it("normalizes missing protocol", () => {
    expect(normalizeInputUrl("youtube.com/watch?v=abc").hostname).toBe("youtube.com");
  });

  it("normalizes Bilibili tracking parameters without changing the video id", () => {
    const normalized = normalizePlatformUrl(
      new URL("https://www.bilibili.com/video/BV1GJ411x7h7/?spm_id_from=333.999&vd_source=abc#reply")
    );

    expect(normalized.hostname).toBe("www.bilibili.com");
    expect(normalized.pathname).toBe("/video/BV1GJ411x7h7/");
    expect(normalized.search).toBe("");
    expect(normalized.hash).toBe("");
  });

  it("keeps Bilibili page selection while removing tracking parameters", () => {
    const normalized = normalizePlatformUrl(
      new URL("https://www.bilibili.com/video/BV1LpD3YsETa?spm_id_from=333.999&p=2&vd_source=abc")
    );

    expect(normalized.pathname).toBe("/video/BV1LpD3YsETa");
    expect(normalized.search).toBe("?p=2");
  });

  it("normalizes X tracking parameters without changing the tweet id", () => {
    const normalized = normalizePlatformUrl(new URL("https://mobile.twitter.com/user/status/12345?s=20&t=abc#fragment"));

    expect(normalized.hostname).toBe("twitter.com");
    expect(normalized.pathname).toBe("/user/status/12345");
    expect(normalized.search).toBe("");
    expect(normalized.hash).toBe("");
  });

  it("distinguishes X status links from profile links", () => {
    expect(isTwitterStatusUrl(new URL("https://x.com/user/status/12345"))).toBe(true);
    expect(isTwitterStatusUrl(new URL("https://twitter.com/i/web/status/12345"))).toBe(true);
    expect(isTwitterStatusUrl(new URL("https://x.com/user"))).toBe(false);
  });
});
