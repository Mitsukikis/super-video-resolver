import { describe, expect, it } from "vitest";
import { detectPlatform, isTwitterStatusUrl, normalizeInputUrl, normalizePlatformUrl } from "@/lib/platform";

describe("platform detection", () => {
  it("detects youtube, bilibili, and x links", () => {
    expect(detectPlatform(new URL("https://www.youtube.com/watch?v=abc"))).toBe("youtube");
    expect(detectPlatform(new URL("https://youtu.be/abc"))).toBe("youtube");
    expect(detectPlatform(new URL("https://www.bilibili.com/video/BV1xx"))).toBe("bilibili");
    expect(detectPlatform(new URL("https://b23.tv/BV1xx"))).toBe("bilibili");
    expect(detectPlatform(new URL("https://x.com/user/status/1"))).toBe("x");
    expect(detectPlatform(new URL("https://twitter.com/user/status/1"))).toBe("x");
    expect(detectPlatform(new URL("https://mobile.twitter.com/user/status/1?s=20"))).toBe("x");
  });

  it("normalizes missing protocol", () => {
    expect(normalizeInputUrl("youtube.com/watch?v=abc").hostname).toBe("youtube.com");
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
