import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { convertYtDlpInfoToManifest, formatYtDlpError } from "@/lib/resolvers/ytDlp";

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

  it("turns Twitter no-video errors into a helpful Chinese message", () => {
    expect(formatYtDlpError("ERROR: [twitter] 2072701117067342056: No video could be found in this tweet")).toContain(
      "X/Twitter 没在这条帖子里找到可下载视频"
    );
  });
});
