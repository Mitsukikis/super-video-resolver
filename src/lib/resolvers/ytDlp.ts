import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Manifest, Platform, Track, Variant } from "@/lib/manifest";
import { ManifestSchema } from "@/lib/manifest";
import { buildFallbacks } from "@/lib/command";
import { detectPlatform } from "@/lib/platform";
import { classifyTemporaryCookie } from "./cookieInput";
import type { ResolveInput, ResolverPlugin } from "./types";
import { resolverProfiles } from "./profiles";
import {
  resolveYtDlpExecutable,
  resolverDependencyMissingMessage
} from "@/lib/server/runtimeCapabilities";

type YtDlpFormat = {
  format_id?: string;
  url?: string;
  ext?: string;
  vcodec?: string;
  acodec?: string;
  width?: number | null;
  height?: number | null;
  fps?: number | null;
  tbr?: number | null;
  abr?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  protocol?: string;
};

type YtDlpInfo = {
  webpage_url?: string;
  title?: string;
  uploader?: string;
  channel?: string;
  duration?: number | null;
  thumbnail?: string | null;
  formats?: YtDlpFormat[];
};

function positiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function positiveInt(value: number | null | undefined) {
  const number = positiveNumber(value);
  return number ? Math.round(number) : undefined;
}

function trackKind(format: YtDlpFormat): Track["kind"] {
  const protocol = format.protocol?.toLowerCase() ?? "";
  if (protocol.includes("m3u8") || format.ext === "m3u8") return "hls";
  if (protocol.includes("dash") || format.ext === "mpd") return "dash";

  const hasVideo = Boolean(format.vcodec && format.vcodec !== "none");
  const hasAudio = Boolean(format.acodec && format.acodec !== "none");
  if (hasVideo && hasAudio) return "combined";
  if (hasVideo) return "video";
  if (hasAudio) return "audio";
  return "hls";
}

function formatLabel(track: Track) {
  if (track.height) return `${track.height}p`;
  if (track.bitrateKbps) return `${track.bitrateKbps} kbps`;
  return track.id;
}

function toPublicYtDlpError(message: string) {
  const lines = message
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/RequestsDependencyWarning|warnings\.warn\(/i.test(line))
    .filter((line) => !/site-packages[\\/].*requests[\\/]__init__\.py/i.test(line));
  const preferred = lines.filter((line) => /^(ERROR|WARNING):/i.test(line));
  const selected = (preferred.length ? preferred : lines).join("\n") || message.trim();

  return selected
    .replace(/[A-Z]:\\[^\r\n]+/g, "[server-path-redacted]")
    .replace(/\/(?:[^/\s]+\/){2,}[^/\s]+/g, "[server-path-redacted]")
    .replace(/https?:\/\/\S+/g, "[url-redacted]");
}

export function formatYtDlpError(message: string) {
  const text = toPublicYtDlpError(message);
  if (/ENOENT|not found|is not recognized|No such file or directory/i.test(text)) {
    return resolverDependencyMissingMessage;
  }
  if (/twitter].*No video could be found in this tweet/i.test(text)) {
    return "X/Twitter 没在这条帖子里找到可下载视频。可能是图片/文字帖、引用帖、私密/敏感/登录可见内容，或需要粘贴 X 的临时 Cookie。";
  }
  if (/login|sign in|cookies?|authentication|unauthori[sz]ed/i.test(text)) {
    return "该平台需要账号态。请先输入本站访问码，再粘贴对应平台的临时 Cookie 后重试。";
  }
  return text || "解析失败";
}

export function convertYtDlpInfoToManifest(
  info: YtDlpInfo,
  platform: Platform,
  sourceUrl: string,
  containsCookie: boolean
): Manifest {
  const tracks: Track[] = [];

  for (const format of info.formats ?? []) {
    if (!format.url || !format.format_id) continue;
    if (format.ext === "mhtml" || format.protocol === "mhtml") continue;
    const kind = trackKind(format);
    tracks.push({
      id: format.format_id,
      kind,
      url: format.url,
      container: format.ext,
      codec: [format.vcodec, format.acodec].filter(Boolean).filter((value) => value !== "none").join(",") || undefined,
      bitrateKbps: positiveInt(format.tbr ?? format.abr),
      width: positiveInt(format.width),
      height: positiveInt(format.height),
      fps: positiveNumber(format.fps),
      sizeBytes: positiveInt(format.filesize ?? format.filesize_approx)
    });
  }

  const videoTracks = tracks.filter((track) => track.kind === "video").sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  const audioTracks = tracks.filter((track) => track.kind === "audio").sort((a, b) => (b.bitrateKbps ?? 0) - (a.bitrateKbps ?? 0));
  const combinedTracks = tracks.filter((track) => track.kind === "combined").sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  const streamTracks = tracks.filter((track) => track.kind === "hls" || track.kind === "dash");

  const variants: Variant[] = combinedTracks.map((track) => ({
    id: `combined-${track.id}`,
    label: `${formatLabel(track)} 已合并`,
    kind: "combined",
    action: "direct-save",
    combinedTrackId: track.id,
    width: track.width,
    height: track.height,
    fps: track.fps,
    bitrateKbps: track.bitrateKbps,
    container: track.container,
    sizeBytes: track.sizeBytes
  }));

  const bestAudio = audioTracks[0];
  for (const video of videoTracks) {
    if (!bestAudio) continue;
    variants.push({
      id: `split-${video.id}-${bestAudio.id}`,
      label: `${formatLabel(video)} 视频+音频`,
      kind: "split",
      action: "browser-merge",
      videoTrackId: video.id,
      audioTrackId: bestAudio.id,
      width: video.width,
      height: video.height,
      fps: video.fps,
      bitrateKbps: video.bitrateKbps,
      container: "mp4",
      sizeBytes: video.sizeBytes && bestAudio.sizeBytes ? video.sizeBytes + bestAudio.sizeBytes : undefined
    });
  }

  for (const stream of streamTracks) {
    variants.push({
      id: `stream-${stream.id}`,
      label: `${formatLabel(stream)} ${stream.kind.toUpperCase()}`,
      kind: "stream",
      action: "local-tool",
      combinedTrackId: stream.id,
      width: stream.width,
      height: stream.height,
      fps: stream.fps,
      bitrateKbps: stream.bitrateKbps,
      container: stream.container,
      sizeBytes: stream.sizeBytes
    });
  }

  const manifest = {
    sourceUrl,
    platform,
    title: info.title ?? "未命名视频",
    author: info.uploader ?? info.channel,
    durationSeconds: positiveNumber(info.duration),
    thumbnailUrl: info.thumbnail ?? undefined,
    variants,
    tracks,
    warnings: containsCookie ? ["本次解析使用了临时 Cookie。请勿分享包含 Cookie 的命令或链接。"] : [],
    fallbacks: buildFallbacks(sourceUrl, containsCookie)
  };

  return ManifestSchema.parse(manifest);
}

export async function runYtDlp(input: ResolveInput): Promise<Manifest> {
  const executable = resolveYtDlpExecutable();
  if (!executable.available) {
    throw new Error(executable.message);
  }

  const timeoutMs = Number(process.env.RESOLVE_TIMEOUT_MS ?? "60000");
  const args = ["--dump-single-json", "--no-playlist", "--no-warnings"];
  const proxy = process.env.YT_DLP_PROXY?.trim();
  let cookieTempDir: string | undefined;

  if (proxy && (input.platform === "youtube" || input.platform === "x")) {
    args.push("--proxy", proxy);
  }

  const cookieInput = classifyTemporaryCookie(input.temporaryCookie);
  if (cookieInput.kind === "header") {
    args.push(...cookieInput.args);
  } else if (cookieInput.kind === "file") {
    cookieTempDir = await mkdtemp(join(tmpdir(), "super-video-cookies-"));
    const cookiePath = join(cookieTempDir, "cookies.txt");
    await writeFile(cookiePath, cookieInput.content, { mode: 0o600 });
    args.push("--cookies", cookiePath);
  }

  args.push(input.url.toString());

  try {
    const output = await new Promise<string>((resolve, reject) => {
      const child = spawn(executable.command, args, { shell: false });
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("解析超时"));
      }, timeoutMs);

      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0 && stdout.trim()) {
          resolve(stdout);
          return;
        }
        reject(new Error(formatYtDlpError(stderr.trim() || `yt-dlp exited with code ${code}`)));
      });
    });

    const info = JSON.parse(output) as YtDlpInfo;
    return convertYtDlpInfoToManifest(info, input.platform, input.url.toString(), Boolean(input.temporaryCookie));
  } finally {
    if (cookieTempDir) {
      await rm(cookieTempDir, { recursive: true, force: true });
    }
  }
}

export function createYtDlpResolver(platform: Platform): ResolverPlugin {
  const profile = resolverProfiles[platform];
  return {
    id: platform,
    displayName: profile.displayName,
    capabilities: {
      supportsTemporaryCookie: true,
      commonBrowserFetch: platform === "youtube" ? "mixed" : "unlikely",
      outputTypes: ["combined", "split", "hls", "dash"]
    },
    match(url) {
      return detectPlatform(url) === platform;
    },
    resolve(input) {
      return runYtDlp(input);
    }
  };
}
