import { describe, expect, it } from "vitest";
import type { Manifest } from "@/lib/manifest";
import { buildResourceModel, formatBytes } from "@/lib/client/resourceModel";

const manifest: Manifest = {
  sourceUrl: "https://www.youtube.com/watch?v=abc",
  platform: "youtube",
  title: "Fixture",
  author: "Author",
  durationSeconds: 90,
  variants: [
    {
      id: "combined-18",
      label: "360p 已合并",
      kind: "combined",
      action: "direct-save",
      combinedTrackId: "18",
      height: 360,
      container: "mp4"
    },
    {
      id: "split-137-a1",
      label: "1080p 视频+音频",
      kind: "split",
      action: "browser-merge",
      videoTrackId: "137",
      audioTrackId: "a1",
      height: 1080,
      container: "mp4"
    }
  ],
  tracks: [
    { id: "18", kind: "combined", url: "https://cdn.example/18.mp4", container: "mp4", height: 360, sizeBytes: 1048576 },
    { id: "137", kind: "video", url: "https://cdn.example/137.mp4", container: "mp4", height: 1080, fps: 30 },
    { id: "a1", kind: "audio", url: "https://cdn.example/a1.m4a", container: "m4a", bitrateKbps: 128 },
    { id: "hls", kind: "hls", url: "https://cdn.example/index.m3u8", container: "m3u8" }
  ],
  warnings: ["cookie warning"],
  fallbacks: []
};

describe("resourceModel", () => {
  it("groups tracks and marks whether variants need browser merge", () => {
    const model = buildResourceModel(manifest);

    expect(model.videoTracks.map((track) => track.id)).toEqual(["137"]);
    expect(model.audioTracks.map((track) => track.id)).toEqual(["a1"]);
    expect(model.combinedTracks.map((track) => track.id)).toEqual(["18"]);
    expect(model.streamTracks.map((track) => track.id)).toEqual(["hls"]);
    expect(model.subtitleTracks).toEqual([]);
    expect(model.variants.find((variant) => variant.id === "split-137-a1")).toMatchObject({
      needsMerge: true,
      actionLabel: "浏览器本地合并"
    });
  });

  it("formats bytes only when a reliable size exists", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
    expect(formatBytes(undefined)).toBe("未知");
  });
});

