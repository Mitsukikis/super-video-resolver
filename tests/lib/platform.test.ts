import { describe, expect, it } from "vitest";
import { detectPlatform, normalizeInputUrl } from "@/lib/platform";

describe("platform detection", () => {
  it("detects youtube, bilibili, and x links", () => {
    expect(detectPlatform(new URL("https://www.youtube.com/watch?v=abc"))).toBe("youtube");
    expect(detectPlatform(new URL("https://youtu.be/abc"))).toBe("youtube");
    expect(detectPlatform(new URL("https://www.bilibili.com/video/BV1xx"))).toBe("bilibili");
    expect(detectPlatform(new URL("https://b23.tv/BV1xx"))).toBe("bilibili");
    expect(detectPlatform(new URL("https://x.com/user/status/1"))).toBe("x");
    expect(detectPlatform(new URL("https://twitter.com/user/status/1"))).toBe("x");
  });

  it("normalizes missing protocol", () => {
    expect(normalizeInputUrl("youtube.com/watch?v=abc").hostname).toBe("youtube.com");
  });
});
