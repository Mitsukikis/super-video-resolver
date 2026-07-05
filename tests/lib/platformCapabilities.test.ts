import { describe, expect, it } from "vitest";
import { detectInputPlatform, getLivePlatforms, getPlannedPlatforms, platformCapabilities } from "@/lib/platformCapabilities";

describe("platformCapabilities", () => {
  it("keeps real supported platforms separate from planned platforms", () => {
    expect(getLivePlatforms().map((platform) => platform.id)).toEqual(["youtube", "bilibili", "x"]);
    expect(getPlannedPlatforms().map((platform) => platform.id)).toEqual(["douyin", "xiaohongshu", "weibo"]);
    expect(platformCapabilities.douyin.resolveEnabled).toBe(false);
  });

  it("detects supported, unknown, invalid, and empty links for the UI", () => {
    expect(detectInputPlatform("https://youtu.be/demo")).toMatchObject({
      status: "supported",
      platformId: "youtube",
      canResolve: true
    });

    expect(detectInputPlatform("https://b23.tv/BV1GJ411x7h7")).toMatchObject({
      status: "supported",
      platformId: "bilibili",
      canResolve: true
    });

    expect(detectInputPlatform("https://www.douyin.com/video/123")).toMatchObject({
      status: "planned",
      platformId: "douyin",
      canResolve: false
    });

    expect(detectInputPlatform("https://example.com/watch/1")).toMatchObject({
      status: "unknown",
      canResolve: false
    });

    expect(detectInputPlatform("https://x.com/NASA")).toMatchObject({
      status: "invalid",
      platformId: "x",
      canResolve: false
    });

    expect(detectInputPlatform("ftp://example.com/file")).toMatchObject({
      status: "invalid",
      canResolve: false
    });

    expect(detectInputPlatform("")).toMatchObject({
      status: "empty",
      canResolve: false
    });
  });
});
