import { describe, expect, it } from "vitest";
import { buildFallbacks, buildFfmpegMergeCommand } from "@/lib/command";

describe("buildFallbacks", () => {
  it("creates safe commands without cookies by default", () => {
    const fallbacks = buildFallbacks("https://www.youtube.com/watch?v=abc", false);
    expect(fallbacks.map((fallback) => fallback.id)).toEqual(["yt-dlp", "aria2"]);
    expect(fallbacks.every((fallback) => fallback.containsSensitiveData === false)).toBe(true);
    expect(fallbacks[0].command).toContain("yt-dlp");
  });

  it("marks cookie-aware command guidance as sensitive", () => {
    const fallbacks = buildFallbacks("https://www.youtube.com/watch?v=abc", true);
    expect(fallbacks.some((fallback) => fallback.containsSensitiveData)).toBe(true);
  });

  it("builds an ffmpeg merge command", () => {
    const command = buildFfmpegMergeCommand("https://media.example/v.mp4", "https://media.example/a.m4a");
    expect(command).toContain("ffmpeg");
    expect(command).toContain("-c copy");
  });
});

