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
    return { ok: false, reason: "unsupported-browser", message: "浏览器合并只能在浏览器中运行。" };
  }

  if (!videoTrack || !audioTrack) {
    return { ok: false, reason: "missing-track", message: "当前清晰度缺少视频轨道或音频轨道。" };
  }

  const compatibleContainers = new Set(["mp4", "m4a", "webm"]);
  if (
    (videoTrack.container && !compatibleContainers.has(videoTrack.container)) ||
    (audioTrack.container && !compatibleContainers.has(audioTrack.container))
  ) {
    return { ok: false, reason: "format", message: "该格式需要使用 ffmpeg 或 yt-dlp 等本地工具处理。" };
  }

  if (!("Blob" in window)) {
    return { ok: false, reason: "unsupported-browser", message: "当前浏览器无法保存合并后的媒体文件。" };
  }

  try {
    await Promise.all([
      fetch(videoTrack.url, { method: "HEAD", mode: "cors" }),
      fetch(audioTrack.url, { method: "HEAD", mode: "cors" })
    ]);
    return { ok: true };
  } catch {
    return { ok: false, reason: "cors", message: "源站阻止了浏览器读取媒体，请使用本地工具命令。" };
  }
}

export async function mergeTracksWithFfmpeg(videoTrack: Track, audioTrack: Track, onProgress?: (message: string) => void) {
  onProgress?.("正在加载浏览器合并引擎...");
  const [{ FFmpeg }, { fetchFile }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
  const ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => onProgress?.(message));
  ffmpeg.on("progress", ({ progress }) => onProgress?.(`正在合并 ${(progress * 100).toFixed(0)}%`));

  await ffmpeg.load();
  onProgress?.("正在获取媒体轨道...");
  await ffmpeg.writeFile("video.mp4", await fetchFile(videoTrack.url));
  await ffmpeg.writeFile("audio.m4a", await fetchFile(audioTrack.url));
  onProgress?.("正在封装视频和音频...");
  await ffmpeg.exec(["-i", "video.mp4", "-i", "audio.m4a", "-c", "copy", "output.mp4"]);
  const file = await ffmpeg.readFile("output.mp4");
  if (typeof file === "string") {
    return new Blob([file], { type: "video/mp4" });
  }
  const bytes = new Uint8Array(file);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Blob([buffer], { type: "video/mp4" });
}
