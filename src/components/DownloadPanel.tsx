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

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

function directLink(track?: Track) {
  if (!track) return null;
  return (
    <a className="button" href={track.url} target="_blank" rel="noreferrer">
      Open direct media URL
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
    setStatus("Checking browser access...");
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
      setStatus("Merged file saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Browser merge failed. Use a local-tool fallback.");
      setStatus(null);
    }
  }

  return (
    <div className="panel stack">
      <div>
        <h3>Download action</h3>
        <p className="muted">Selected: {variant.label}</p>
      </div>

      {variant.action === "direct-save" ? (
        <div className="row">
          {directLink(combinedTrack)}
          <span className="muted">Your browser downloads from the source URL, not from this server.</span>
        </div>
      ) : null}

      {variant.action === "browser-merge" ? (
        <div className="stack">
          <div className="row">
            <button className="button" type="button" onClick={browserMerge}>
              Merge in browser
            </button>
            <span className="muted">If CORS blocks this, use the commands below.</span>
          </div>
          {status ? <p className="muted">{status}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
      ) : null}

      <details>
        <summary>Track URLs</summary>
        <div className="stack" style={{ marginTop: 12 }}>
          {[videoTrack, audioTrack, combinedTrack].filter(Boolean).map((track) => (
            <div key={(track as Track).id} className="code-block">
              {(track as Track).kind}: {(track as Track).url}
            </div>
          ))}
        </div>
      </details>

      <div className="stack">
        <h3>Local-tool fallbacks</h3>
        {ffmpegCommand ? (
          <div className="stack">
            <strong>ffmpeg merge</strong>
            <pre className="code-block">{ffmpegCommand}</pre>
            <button className="button secondary" type="button" onClick={() => copy(ffmpegCommand)}>
              Copy ffmpeg command
            </button>
          </div>
        ) : null}

        {manifest.fallbacks.map((fallback) => (
          <div className="stack" key={fallback.id}>
            <strong>{fallback.label}</strong>
            {fallback.containsSensitiveData ? <p className="warning">This command may involve local cookies. Do not share it.</p> : null}
            <pre className="code-block">{fallback.command}</pre>
            <button className="button secondary" type="button" onClick={() => copy(fallback.command)}>
              Copy command
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

