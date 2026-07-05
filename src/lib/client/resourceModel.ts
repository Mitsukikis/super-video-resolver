import type { Manifest, Track, Variant } from "@/lib/manifest";

export type ResourceVariant = Variant & {
  actionLabel: string;
  kindLabel: string;
  needsMerge: boolean;
  hasAudio: boolean;
};

export type ResourceModel = {
  videoTracks: Track[];
  audioTracks: Track[];
  combinedTracks: Track[];
  streamTracks: Track[];
  subtitleTracks: Track[];
  variants: ResourceVariant[];
};

const kindLabels: Record<Variant["kind"], string> = {
  combined: "已合并",
  split: "音视频分离",
  stream: "流媒体"
};

const actionLabels: Record<Variant["action"], string> = {
  "direct-save": "源站直链下载",
  "browser-merge": "浏览器本地合并",
  "local-tool": "本地工具处理",
  unsupported: "暂不支持"
};

function byQualityDesc(a: Track, b: Track) {
  return (b.height ?? 0) - (a.height ?? 0) || (b.bitrateKbps ?? 0) - (a.bitrateKbps ?? 0);
}

export function buildResourceModel(manifest: Manifest): ResourceModel {
  const videoTracks = manifest.tracks.filter((track) => track.kind === "video").sort(byQualityDesc);
  const audioTracks = manifest.tracks.filter((track) => track.kind === "audio").sort(byQualityDesc);
  const combinedTracks = manifest.tracks.filter((track) => track.kind === "combined").sort(byQualityDesc);
  const streamTracks = manifest.tracks.filter((track) => track.kind === "hls" || track.kind === "dash").sort(byQualityDesc);

  return {
    videoTracks,
    audioTracks,
    combinedTracks,
    streamTracks,
    subtitleTracks: [],
    variants: manifest.variants.map((variant) => ({
      ...variant,
      actionLabel: actionLabels[variant.action],
      kindLabel: kindLabels[variant.kind],
      needsMerge: variant.action === "browser-merge" || variant.kind === "split",
      hasAudio: Boolean(variant.audioTrackId || variant.combinedTrackId)
    }))
  };
}

export function formatBytes(bytes?: number) {
  if (!bytes) return "未知";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function describeTrack(track: Track) {
  return [
    track.height ? `${track.height}p` : null,
    track.fps ? `${track.fps}fps` : null,
    track.bitrateKbps ? `${track.bitrateKbps}kbps` : null,
    track.container,
    track.codec
  ]
    .filter(Boolean)
    .join(" · ");
}

