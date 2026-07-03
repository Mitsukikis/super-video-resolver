import { describe, expect, it } from "vitest";
import { ManifestSchema } from "@/lib/manifest";

describe("ManifestSchema", () => {
  it("accepts a split HD variant", () => {
    const result = ManifestSchema.safeParse({
      sourceUrl: "https://www.youtube.com/watch?v=abc123",
      platform: "youtube",
      title: "Example",
      variants: [
        {
          id: "1080p",
          label: "1080p",
          action: "browser-merge",
          kind: "split",
          videoTrackId: "v1",
          audioTrackId: "a1",
          width: 1920,
          height: 1080,
          container: "mp4"
        }
      ],
      tracks: [
        { id: "v1", kind: "video", url: "https://video.example/v.mp4", container: "mp4", codec: "avc1" },
        { id: "a1", kind: "audio", url: "https://video.example/a.m4a", container: "m4a", codec: "mp4a" }
      ],
      warnings: [],
      fallbacks: []
    });

    expect(result.success).toBe(true);
  });
});

