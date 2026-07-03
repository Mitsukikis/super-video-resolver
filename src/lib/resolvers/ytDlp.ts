import { spawn } from "node:child_process";
import type { Manifest, Platform, Track, Variant } from "@/lib/manifest";
import { ManifestSchema } from "@/lib/manifest";
import { buildFallbacks } from "@/lib/command";
import { detectPlatform } from "@/lib/platform";
import type { ResolveInput, ResolverPlugin } from "./types";
import { resolverProfiles } from "./profiles";

type YtDlpFormat = {
  format_id?: string;
  url?: string;
  ext?: string;
  vcodec?: string;
  acodec?: string;
  width?: number;
  height?: number;
  fps?: number;
  tbr?: number;
  abr?: number;
  filesize?: number;
  filesize_approx?: number;
  protocol?: string;
};

type YtDlpInfo = {
  webpage_url?: string;
  title?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  thumbnail?: string;
  formats?: YtDlpFormat[];
};

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

export function convertYtDlpInfoToManifest(
  info: YtDlpInfo,
  platform: Platform,
  sourceUrl: string,
  containsCookie: boolean
): Manifest {
  const tracks: Track[] = [];

  for (const format of info.formats ?? []) {
    if (!format.url || !format.format_id) continue;
    const kind = trackKind(format);
    tracks.push({
      id: format.format_id,
      kind,
      url: format.url,
      container: format.ext,
      codec: [format.vcodec, format.acodec].filter(Boolean).filter((value) => value !== "none").join(",") || undefined,
      bitrateKbps: Math.round(format.tbr ?? format.abr ?? 0) || undefined,
      width: format.width,
      height: format.height,
      fps: format.fps,
      sizeBytes: format.filesize ?? format.filesize_approx
    });
  }

  const videoTracks = tracks.filter((track) => track.kind === "video").sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  const audioTracks = tracks.filter((track) => track.kind === "audio").sort((a, b) => (b.bitrateKbps ?? 0) - (a.bitrateKbps ?? 0));
  const combinedTracks = tracks.filter((track) => track.kind === "combined").sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  const streamTracks = tracks.filter((track) => track.kind === "hls" || track.kind === "dash");

  const variants: Variant[] = combinedTracks.map((track) => ({
    id: `combined-${track.id}`,
    label: `${formatLabel(track)} combined`,
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
      label: `${formatLabel(video)} video + audio`,
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
    title: info.title ?? "Untitled video",
    author: info.uploader ?? info.channel,
    durationSeconds: info.duration,
    thumbnailUrl: info.thumbnail,
    variants,
    tracks,
    warnings: containsCookie ? ["This result used a temporary cookie. Do not share generated commands containing cookies."] : [],
    fallbacks: buildFallbacks(sourceUrl, containsCookie)
  };

  return ManifestSchema.parse(manifest);
}

export async function runYtDlp(input: ResolveInput): Promise<Manifest> {
  const executable = process.env.YT_DLP_BIN || "yt-dlp";
  const timeoutMs = Number(process.env.RESOLVE_TIMEOUT_MS ?? "60000");
  const args = ["--dump-single-json", "--no-playlist", "--no-warnings"];
  const proxy = process.env.YT_DLP_PROXY?.trim();

  if (proxy && (input.platform === "youtube" || input.platform === "x")) {
    args.push("--proxy", proxy);
  }

  if (input.temporaryCookie) {
    args.push("--add-header", `Cookie:${input.temporaryCookie}`);
  }

  args.push(input.url.toString());

  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn(executable, args, { shell: false });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Resolver timed out"));
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
      reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
    });
  });

  const info = JSON.parse(output) as YtDlpInfo;
  return convertYtDlpInfoToManifest(info, input.platform, input.url.toString(), Boolean(input.temporaryCookie));
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
