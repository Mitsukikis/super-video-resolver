"use client";

import { useMemo, useState } from "react";
import { buildFfmpegMergeCommand } from "@/lib/command";
import type { Manifest, Track, Variant } from "@/lib/manifest";
import { checkBrowserMerge, mergeTracksWithFfmpeg } from "@/lib/client/browserMerge";

type DownloadPanelProps = {
  manifest: Manifest;
  variant: Variant;
};

function findTrack(manifest: Manifest, id?: string) {
  return manifest.tracks.find((track) => track.id === id);
}

const trackKindLabels: Record<Track["kind"], string> = {
  video: "视频",
  audio: "音频",
  combined: "已合并",
  hls: "HLS",
  dash: "DASH"
};

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

function directLink(track?: Track) {
  if (!track) return null;
  return (
    <a className="button" href={track.url} target="_blank" rel="noreferrer">
      打开直链下载
    </a>
  );
}

export function DownloadPanel({ manifest, variant }: DownloadPanelProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoTrack = findTrack(manifest, variant.videoTrackId);
  const audioTrack = findTrack(manifest, variant.audioTrackId);
  const combinedTrack = findTrack(manifest, variant.combinedTrackId);
  const ffmpegCommand = useMemo(
    () => (videoTrack && audioTrack ? buildFfmpegMergeCommand(videoTrack.url, audioTrack.url, `${manifest.title}.mp4`) : null),
    [audioTrack, manifest.title, videoTrack]
  );

  async function browserMerge() {
    setError(null);
    setStatus("正在检查浏览器访问能力...");
    const check = await checkBrowserMerge(videoTrack, audioTrack);
    if (!check.ok) {
      setStatus(null);
      setError(check.message);
      return;
    }

    if (!videoTrack || !audioTrack) return;

    try {
      const blob = await mergeTracksWithFfmpeg(videoTrack, audioTrack, setStatus);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${manifest.title}.mp4`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("合并文件已保存。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "浏览器合并失败，请改用本地工具命令。");
      setStatus(null);
    }
  }

  return (
    <div className="panel stack">
      <div>
        <h3>下载方式</h3>
        <p className="muted">当前选择：{variant.label}</p>
      </div>

      {variant.action === "direct-save" ? (
        <div className="row">
          {directLink(combinedTrack)}
          <span className="muted">浏览器会从源站直连下载，不经过本站服务器。</span>
        </div>
      ) : null}

      {variant.action === "browser-merge" ? (
        <div className="stack">
          <div className="row">
            <button className="button" type="button" onClick={browserMerge}>
              在浏览器中合并
            </button>
            <span className="muted">如果源站 CORS 阻止访问，请使用下方本地命令。</span>
          </div>
          {status ? <p className="muted">{status}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
      ) : null}

      <details>
        <summary>媒体轨道链接</summary>
        <div className="stack" style={{ marginTop: 12 }}>
          {[videoTrack, audioTrack, combinedTrack].filter(Boolean).map((track) => (
            <div key={(track as Track).id} className="code-block">
              {trackKindLabels[(track as Track).kind]}: {(track as Track).url}
            </div>
          ))}
        </div>
      </details>

      <div className="stack">
        <h3>本地工具命令</h3>
        {ffmpegCommand ? (
          <div className="stack">
            <strong>ffmpeg 合并</strong>
            <pre className="code-block">{ffmpegCommand}</pre>
            <button className="button secondary" type="button" onClick={() => copy(ffmpegCommand)}>
              复制 ffmpeg 命令
            </button>
          </div>
        ) : null}

        {manifest.fallbacks.map((fallback) => (
          <div className="stack" key={fallback.id}>
            <strong>{fallback.label}</strong>
            {fallback.containsSensitiveData ? <p className="warning">此命令可能涉及本地 Cookie，请勿分享。</p> : null}
            <pre className="code-block">{fallback.command}</pre>
            <button className="button secondary" type="button" onClick={() => copy(fallback.command)}>
              复制命令
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
