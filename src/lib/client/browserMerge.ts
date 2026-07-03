import type { Track } from "@/lib/manifest";

export type BrowserMergeCheck =
  | { ok: true }
  | {
      ok: false;
      reason: "cors" | "storage" | "format" | "missing-track" | "unsupported-browser";
      message: string;
    };

export async function checkBrowserMerge(videoTrack?: Track, audioTrack?: Track): Promise<BrowserMergeCheck> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "unsupported-browser", message: "Browser merge can only run in the browser." };
  }

  if (!videoTrack || !audioTrack) {
    return { ok: false, reason: "missing-track", message: "The selected quality is missing a video or audio track." };
  }

  const compatibleContainers = new Set(["mp4", "m4a", "webm"]);
  if (
    (videoTrack.container && !compatibleContainers.has(videoTrack.container)) ||
    (audioTrack.container && !compatibleContainers.has(audioTrack.container))
  ) {
    return { ok: false, reason: "format", message: "This format needs a local tool such as ffmpeg or yt-dlp." };
  }

  if (!("Blob" in window)) {
    return { ok: false, reason: "unsupported-browser", message: "This browser cannot save merged media files." };
  }

  try {
    await Promise.all([
      fetch(videoTrack.url, { method: "HEAD", mode: "cors" }),
      fetch(audioTrack.url, { method: "HEAD", mode: "cors" })
    ]);
    return { ok: true };
  } catch {
    return { ok: false, reason: "cors", message: "The source platform blocked browser fetch. Use a local-tool fallback." };
  }
}

export async function mergeTracksWithFfmpeg(videoTrack: Track, audioTrack: Track, onProgress?: (message: string) => void) {
  onProgress?.("Loading browser merge engine...");
  const [{ FFmpeg }, { fetchFile }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
  const ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => onProgress?.(message));
  ffmpeg.on("progress", ({ progress }) => onProgress?.(`Merging ${(progress * 100).toFixed(0)}%`));

  await ffmpeg.load();
  onProgress?.("Fetching media tracks...");
  await ffmpeg.writeFile("video.mp4", await fetchFile(videoTrack.url));
  await ffmpeg.writeFile("audio.m4a", await fetchFile(audioTrack.url));
  onProgress?.("Muxing video and audio...");
  await ffmpeg.exec(["-i", "video.mp4", "-i", "audio.m4a", "-c", "copy", "output.mp4"]);
  const file = await ffmpeg.readFile("output.mp4");
  if (typeof file === "string") {
    return new Blob([file], { type: "video/mp4" });
  }
  const bytes = new Uint8Array(file);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Blob([buffer], { type: "video/mp4" });
}
