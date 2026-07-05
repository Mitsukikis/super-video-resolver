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

function trackKind(format: YtDlpFormat, platform: Platform): Track["kind"] {
  const protocol = format.protocol?.toLowerCase() ?? "";
  const isDirectHttp = protocol === "http" || protocol === "https" || /^https?:\/\//i.test(format.url ?? "");

  if (
    platform === "x" &&
    format.ext === "mp4" &&
    isDirectHttp &&
    /^http-/i.test(format.format_id ?? "") &&
    positiveNumber(format.width) &&
    positiveNumber(format.height)
  ) {
    return "combined";
  }

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

const bilibiliUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const twitterUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export function buildYtDlpBaseArgs(platform: Platform) {
  const args = ["--dump-single-json", "--no-playlist", "--no-warnings", "--retries", "2", "--fragment-retries", "2"];

  if (platform === "bilibili") {
    args.push("--add-header", "Referer:https://www.bilibili.com/");
    args.push("--add-header", `User-Agent:${bilibiliUserAgent}`);
  }
  if (platform === "x") {
    args.push("--add-header", "Referer:https://x.com/");
    args.push("--add-header", `User-Agent:${twitterUserAgent}`);
  }

  return args;
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
  if (/ENOENT|is not recognized|No such file or directory|yt-dlp(?:\.exe)?: command not found/i.test(text)) {
    return resolverDependencyMissingMessage;
  }
  if (/\[(twitter|x)\]|Twitter|X\/Twitter|tweet/i.test(text)) {
    if (/No video could be found in this tweet|no downloadable video|no media found/i.test(text)) {
      return "X/Twitter 推文里没有内嵌视频或可下载 MP4 variants。请确认链接是单条公开推文，并且推文本身包含 Twitter/X 原生视频或 GIF。";
    }
    if (/protected|private|not authorized|permission|Forbidden/i.test(text)) {
      return "X/Twitter 受保护账号或私密推文无法解析。本站不绕过受保护账号、私密内容或账号权限。";
    }
    if (/login required|sign in|authentication|not logged in|cookies?|age|sensitive|adult/i.test(text)) {
      return "X/Twitter 需要登录或年龄/敏感内容确认。请确认是公开视频；必要时登录本站后粘贴自己的 X/Twitter 临时 Cookie。";
    }
    if (/not found|does not exist|unavailable|deleted|suspended/i.test(text)) {
      return "X/Twitter 推文不存在、已删除、账号异常或无法公开访问。请换一个公开公开视频推文测试。";
    }
    if (/external|card|player|youtube|vimeo|periscope|broadcast/i.test(text)) {
      return "X/Twitter 推文包含外部视频卡片，当前只支持 Twitter/X 原生视频和 GIF 的 MP4 variants。";
    }
    if (/region|country|geo|location/i.test(text)) {
      return "X/Twitter 视频可能存在地区限制。本站不绕过地区、账号或平台访问限制。";
    }
    if (/429|rate|guest token|Precondition Failed|HTTP Error 4\d\d/i.test(text)) {
      return "X/Twitter 源站策略拦截或临时限流。可以稍后重试，或在有权限的前提下提供自己的平台 Cookie。";
    }
    if (/Unsupported URL|Unable to extract|extractor|update yt-dlp/i.test(text)) {
      return "X/Twitter 解析器可能需要更新。请联系管理员更新 yt-dlp 后重试。";
    }
  }
  if (/BiliBili|bilibili/i.test(text)) {
    if (/HTTP Error 412|412: Precondition Failed|Precondition Failed/i.test(text)) {
      return "Bilibili 源站请求策略拦截（HTTP 412）。这通常表示当前请求需要平台 Cookie、合理请求头，或源站临时风控。请确认是公开视频，登录本站后粘贴自己的 Bilibili Cookie，或稍后重试。";
    }
    if (/cookie.*(invalid|expired)|invalid.*cookie|SESSDATA|bili_jct|DedeUserID/i.test(text)) {
      return "Bilibili Cookie 可能已失效，请重新导出自己的 Bilibili Cookie 后再试。Cookie 只会用于本次解析请求。";
    }
    if (/login|sign in|cookies?|authentication|unauthori[sz]ed|not logged in/i.test(text)) {
      return "Bilibili 需要登录态。请先输入本站访问码，再粘贴自己的 Bilibili 临时 Cookie 后重试。";
    }
    if (/403|Forbidden|permission|not allowed|insufficient|权限不足/i.test(text)) {
      return "Bilibili Cookie 权限不足或内容受限。请确认账号有权访问该公开视频；本站不绕过会员、付费、DRM 或私密权限。";
    }
    if (/404|not found|不存在|已删除|deleted|removed/i.test(text)) {
      return "Bilibili 视频不存在或已删除。请检查 BV / av / 分 P 链接是否完整。";
    }
    if (/Unsupported URL|Unable to extract|extractor|update yt-dlp/i.test(text)) {
      return "Bilibili 解析器可能需要更新。请联系管理员更新 yt-dlp 后重试。";
    }
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
    const kind = trackKind(format, platform);
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

async function runYtDlpOnce(input: ResolveInput, temporaryCookie?: string): Promise<Manifest> {
  const executable = resolveYtDlpExecutable();
  if (!executable.available) {
    throw new Error(executable.message);
  }

  const timeoutMs = Number(process.env.RESOLVE_TIMEOUT_MS ?? "60000");
  const args = buildYtDlpBaseArgs(input.platform);
  const proxy = process.env.YT_DLP_PROXY?.trim();
  let cookieTempDir: string | undefined;

  if (proxy && (input.platform === "youtube" || input.platform === "x")) {
    args.push("--proxy", proxy);
  }

  const cookieInput = classifyTemporaryCookie(temporaryCookie);
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
    return convertYtDlpInfoToManifest(info, input.platform, input.url.toString(), Boolean(temporaryCookie));
  } finally {
    if (cookieTempDir) {
      await rm(cookieTempDir, { recursive: true, force: true });
    }
  }
}

export async function runYtDlp(input: ResolveInput): Promise<Manifest> {
  const temporaryCookie = input.temporaryCookie?.trim();
  if (input.platform === "x" && temporaryCookie) {
    try {
      return await runYtDlpOnce(input);
    } catch {
      return runYtDlpOnce(input, temporaryCookie);
    }
  }

  return runYtDlpOnce(input, temporaryCookie);
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
