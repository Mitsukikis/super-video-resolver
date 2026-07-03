"use client";

import { useMemo, useState } from "react";
import type { Manifest } from "@/lib/manifest";
import { DownloadPanel } from "./DownloadPanel";

type ResultViewProps = {
  manifest: Manifest;
};

function formatDuration(seconds?: number) {
  if (!seconds) return "Unknown duration";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function ResultView({ manifest }: ResultViewProps) {
  const [selectedId, setSelectedId] = useState(manifest.variants[0]?.id ?? "");
  const selectedVariant = useMemo(
    () => manifest.variants.find((variant) => variant.id === selectedId) ?? manifest.variants[0],
    [manifest.variants, selectedId]
  );

  return (
    <section className="panel stack">
      <div className="grid">
        {manifest.thumbnailUrl ? (
          <img
            src={manifest.thumbnailUrl}
            alt=""
            style={{ width: "100%", borderRadius: 8, border: "1px solid var(--line)" }}
          />
        ) : null}
        <div>
          <p className="eyebrow">{manifest.platform}</p>
          <h2>{manifest.title}</h2>
          <p className="muted">{manifest.author ?? "Unknown author"} · {formatDuration(manifest.durationSeconds)}</p>
          <p className="muted">{manifest.tracks.length} tracks · {manifest.variants.length} download options</p>
        </div>
      </div>

      {manifest.warnings.length ? (
        <div className="panel warning">
          {manifest.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="grid">
        {manifest.variants.map((variant) => (
          <button
            key={variant.id}
            className={`variant ${variant.id === selectedId ? "is-selected" : ""}`}
            type="button"
            onClick={() => setSelectedId(variant.id)}
            style={{ textAlign: "left" }}
          >
            <strong>{variant.label}</strong>
            <p className="muted">{variant.kind} · {variant.action}</p>
            <p className="muted">
              {[variant.width && variant.height ? `${variant.width}x${variant.height}` : null, variant.fps ? `${variant.fps} fps` : null, variant.container]
                .filter(Boolean)
                .join(" · ") || "Metadata unavailable"}
            </p>
          </button>
        ))}
      </div>

      {selectedVariant ? <DownloadPanel manifest={manifest} variant={selectedVariant} /> : null}
    </section>
  );
}

