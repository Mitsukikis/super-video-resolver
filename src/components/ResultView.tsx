"use client";

import { useMemo, useState } from "react";
import type { Manifest, Variant } from "@/lib/manifest";
import { DownloadPanel } from "./DownloadPanel";

type ResultViewProps = {
  manifest: Manifest;
};

function formatDuration(seconds?: number) {
  if (!seconds) return "时长未知";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainder}`;
}

const variantKindLabels: Record<Variant["kind"], string> = {
  combined: "已合并",
  split: "音视频分离",
  stream: "流媒体"
};

const variantActionLabels: Record<Variant["action"], string> = {
  "direct-save": "直链下载",
  "browser-merge": "浏览器合并",
  "local-tool": "本地工具",
  unsupported: "暂不支持"
};

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
          <p className="muted">{manifest.author ?? "作者未知"} | {formatDuration(manifest.durationSeconds)}</p>
          <p className="muted">{manifest.tracks.length} 条媒体轨道 | {manifest.variants.length} 个下载选项</p>
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
            <p className="muted">{variantKindLabels[variant.kind]} | {variantActionLabels[variant.action]}</p>
            <p className="muted">
              {[variant.width && variant.height ? `${variant.width}x${variant.height}` : null, variant.fps ? `${variant.fps} fps` : null, variant.container]
                .filter(Boolean)
                .join(" | ") || "暂无媒体参数"}
            </p>
          </button>
        ))}
      </div>

      {selectedVariant ? <DownloadPanel manifest={manifest} variant={selectedVariant} /> : null}
    </section>
  );
}
