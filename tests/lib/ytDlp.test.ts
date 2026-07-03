import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { convertYtDlpInfoToManifest } from "@/lib/resolvers/ytDlp";

describe("convertYtDlpInfoToManifest", () => {
  it("creates combined and split variants", () => {
    const info = JSON.parse(readFileSync("tests/fixtures/yt-dlp-youtube.json", "utf8"));
    const manifest = convertYtDlpInfoToManifest(info, "youtube", "https://www.youtube.com/watch?v=abc", false);

    expect(manifest.title).toBe("Fixture Video");
    expect(manifest.tracks.some((track) => track.kind === "combined")).toBe(true);
    expect(manifest.variants.some((variant) => variant.action === "browser-merge")).toBe(true);
    expect(manifest.fallbacks.some((fallback) => fallback.id === "yt-dlp")).toBe(true);
  });
});

