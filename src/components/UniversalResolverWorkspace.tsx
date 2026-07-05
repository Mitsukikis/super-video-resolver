"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildFfmpegMergeCommand } from "@/lib/command";
import { checkBrowserMerge, mergeTracksWithFfmpeg } from "@/lib/client/browserMerge";
import { buildResourceModel, describeTrack, formatBytes, type ResourceVariant } from "@/lib/client/resourceModel";
import { classifyResolveError, redactCookieForDisplay, type ClassifiedResolveError } from "@/lib/client/resolveUiState";
import type { Manifest, Track } from "@/lib/manifest";
import { detectInputPlatform, type PlatformCapability, type PlatformDetection } from "@/lib/platformCapabilities";

type UniversalResolverWorkspaceProps = {
  loggedIn: boolean;
  livePlatforms: PlatformCapability[];
  plannedPlatforms: PlatformCapability[];
};

type ResolvePayload =
  | { ok: true; manifest: Manifest }
  | { ok: false; error?: string };

type ResolveStatus = "idle" | "loading" | "success" | "error";

type ResolveState = {
  status: ResolveStatus;
  step: string;
  error?: ClassifiedResolveError;
  manifest?: Manifest;
};

type RuntimeStatus = {
  resolverReady: boolean;
  ytDlpAvailable: boolean;
  ffmpegAvailable: boolean;
  tempDirectoryWritable: boolean;
  browserMergeEnabled: boolean;
};

type TaskStatus = "waiting" | "downloading" | "merging" | "completed" | "cancelled" | "failed";

type DownloadTask = {
  id: string;
  label: string;
  status: TaskStatus;
  detail: string;
  createdAt: number;
};

type CreateTask = (task: Omit<DownloadTask, "id" | "createdAt">) => string;
type UpdateTask = (id: string, patch: Partial<Omit<DownloadTask, "id" | "createdAt">>) => void;

const taskStatusLabels: Record<TaskStatus, string> = {
  waiting: "等待",
  downloading: "下载中",
  merging: "合并中",
  completed: "已完成",
  cancelled: "已取消",
  failed: "失败"
};

const trackKindLabels: Record<Track["kind"], string> = {
  video: "视频",
  audio: "音频",
  combined: "已合并",
  hls: "HLS",
  dash: "DASH"
};

function formatDuration(seconds?: number) {
  if (!seconds) return "时长未知";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${rest}`;
  return `${minutes}:${rest}`;
}

function findTrack(manifest: Manifest, id?: string) {
  if (!id) return undefined;
  return manifest.tracks.find((track) => track.id === id);
}

function validationErrorFromDetection(detection: PlatformDetection): ClassifiedResolveError | null {
  if (detection.status === "empty") {
    return {
      kind: "empty-url",
      title: "请先粘贴视频链接",
      message: "输入框还是空的，解析器没有可处理的地址。",
      nextAction: "粘贴一个公开公开视频链接后再开始解析。",
      retry: false
    };
  }

  if (detection.status === "invalid") {
    return {
      kind: "invalid-url",
      title: "链接格式错误",
      message: detection.message,
      nextAction: "请使用 http:// 或 https:// 开头的完整视频链接。",
      retry: false
    };
  }

  if (detection.status === "planned") {
    return {
      kind: "unsupported-platform",
      title: "平台还没有接入解析器",
      message: detection.message,
      nextAction: "当前只能解析 YouTube、Bilibili 和 X / Twitter；这个平台需要后续新增后端适配器。",
      retry: false
    };
  }

  if (detection.status === "unknown") {
    return {
      kind: "unsupported-platform",
      title: "无法识别平台",
      message: detection.message,
      nextAction: "请换用当前真实支持的平台链接，或等后续新增平台适配器。",
      retry: false
    };
  }

  return null;
}

function statusClass(detection: PlatformDetection) {
  if (detection.status === "supported" && detection.capability?.status === "limited") return "limited";
  return detection.status;
}

function AccessPanel({ loggedIn }: { loggedIn: boolean }) {
  const [accessCode, setAccessCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    if (!accessCode.trim()) return;
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessCode })
    });
    const payload = await response.json().catch(() => null);
    setLoading(false);

    if (!payload?.ok) {
      setMessage(payload?.error ?? "访问码验证失败");
      return;
    }

    location.reload();
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    location.reload();
  }

  if (loggedIn) {
    return (
      <section className="access-panel is-unlocked" aria-label="站内授权状态">
        <div>
          <span className="panel-kicker">站内授权</span>
          <h3>已解锁 Cookie 输入</h3>
          <p>访问码只解锁本站功能，不会自动登录任何视频平台账号。</p>
        </div>
        <button className="ghost-button" type="button" onClick={logout}>
          退出授权
        </button>
      </section>
    );
  }

  return (
    <section className="access-panel" aria-label="站内访问码">
      <div>
        <span className="panel-kicker">访客模式</span>
        <h3>公开链接可直接解析</h3>
        <p>访问码用于解锁“临时平台 Cookie 输入”，不是 Twitter、YouTube 或 B 站登录。</p>
      </div>
      <form className="access-form" onSubmit={submitLogin}>
        <input
          className="text-input"
          type="password"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="本站访问码"
          autoComplete="current-password"
          aria-label="本站访问码"
        />
        <button className="primary-button" type="submit" disabled={loading || !accessCode.trim()}>
          {loading ? "验证中" : "解锁"}
        </button>
      </form>
      {message ? <p className="inline-error">{message}</p> : null}
    </section>
  );
}

function PlatformRail({
  livePlatforms,
  plannedPlatforms,
  activePlatformId,
  onSelect
}: {
  livePlatforms: PlatformCapability[];
  plannedPlatforms: PlatformCapability[];
  activePlatformId?: string;
  onSelect: (platformId: string) => void;
}) {
  return (
    <aside className="platform-rail" aria-label="平台模块">
      <div className="rail-group">
        <span className="rail-label">已接入</span>
        {livePlatforms.map((platform) => (
          <button
            key={platform.id}
            type="button"
            className={activePlatformId === platform.id ? "rail-item is-active" : "rail-item"}
            title={platform.notes}
            onClick={() => onSelect(platform.id)}
          >
            <span className="platform-icon" aria-hidden="true">{platform.shortLabel.slice(0, 2)}</span>
            <span>
              <strong>{platform.label}</strong>
              <small>{platform.statusLabel}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="rail-group">
        <span className="rail-label">待接入</span>
        {plannedPlatforms.map((platform) => (
          <button
            key={platform.id}
            type="button"
            className={activePlatformId === platform.id ? "rail-item is-active is-planned" : "rail-item is-planned"}
            title={platform.notes}
            onClick={() => onSelect(platform.id)}
          >
            <span className="platform-icon" aria-hidden="true">{platform.shortLabel.slice(0, 2)}</span>
            <span>
              <strong>{platform.label}</strong>
              <small>暂不可解析</small>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function PlatformDetector({ detection }: { detection: PlatformDetection }) {
  return (
    <div className={`detector-panel is-${statusClass(detection)}`}>
      <div className="detector-main">
        <span className="detector-icon" aria-hidden="true">
          {detection.capability?.shortLabel.slice(0, 2) ?? "?"}
        </span>
        <div>
          <span className="panel-kicker">自动识别</span>
          <h3>{detection.label}</h3>
          <p>{detection.message}</p>
        </div>
      </div>
      <div className="detector-badges">
        <span>{detection.capability?.statusLabel ?? "未识别"}</span>
        <span>{detection.canResolve ? "可请求解析" : "不会请求后端"}</span>
        {detection.capability?.cookieRequirement === "often" ? <span>建议 Cookie</span> : null}
      </div>
    </div>
  );
}

function ResolveErrorView({ error, onRetry }: { error: ClassifiedResolveError; onRetry?: () => void }) {
  return (
    <div className={`error-panel error-${error.kind}`}>
      <div>
        <strong>{error.title}</strong>
        <p>{error.message}</p>
        <small>{error.nextAction}</small>
      </div>
      {error.retry && onRetry ? (
        <button className="ghost-button" type="button" onClick={onRetry}>
          重试
        </button>
      ) : null}
    </div>
  );
}

function LoadingState({ step, onCancel }: { step: string; onCancel: () => void }) {
  return (
    <div className="loading-panel" role="status" aria-live="polite">
      <span className="indeterminate-loader" aria-hidden="true" />
      <div>
        <strong>{step}</strong>
        <p>当前接口没有真实百分比进度，因此这里只显示步骤，不伪造固定进度条。</p>
      </div>
      <button className="ghost-button" type="button" onClick={onCancel}>
        取消
      </button>
    </div>
  );
}

function MediaSummary({ manifest, capability }: { manifest: Manifest; capability?: PlatformCapability }) {
  return (
    <section className="media-summary">
      <div className="poster-frame">
        {manifest.thumbnailUrl ? (
          <img src={manifest.thumbnailUrl} alt="" />
        ) : (
          <div className="poster-empty">无封面</div>
        )}
      </div>
      <div className="media-meta">
        <span className="panel-kicker">{capability?.label ?? manifest.platform}</span>
        <h2>{manifest.title}</h2>
        <dl>
          <div>
            <dt>发布者</dt>
            <dd>{manifest.author ?? "接口未返回"}</dd>
          </div>
          <div>
            <dt>时长</dt>
            <dd>{formatDuration(manifest.durationSeconds)}</dd>
          </div>
          <div>
            <dt>资源</dt>
            <dd>{manifest.variants.length} 个下载选项 / {manifest.tracks.length} 条轨道</dd>
          </div>
          <div>
            <dt>发布时间</dt>
            <dd>当前接口未返回</dd>
          </div>
        </dl>
        {manifest.expiresAt ? <p className="truth-note">资源链接可能在 {new Date(manifest.expiresAt).toLocaleString()} 后过期。</p> : null}
      </div>
    </section>
  );
}

function TrackTable({ title, tracks, empty }: { title: string; tracks: Track[]; empty: string }) {
  return (
    <div className="track-table">
      <h3>{title}</h3>
      {tracks.length ? (
        <div className="track-rows">
          {tracks.map((track) => (
            <div className="track-row" key={track.id}>
              <div>
                <strong>{trackKindLabels[track.kind]}</strong>
                <span>{describeTrack(track) || "接口未返回编码参数"}</span>
              </div>
              <div>
                <span>{track.width && track.height ? `${track.width} x ${track.height}` : "分辨率未知"}</span>
                <span>{formatBytes(track.sizeBytes)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-hint">{empty}</p>
      )}
    </div>
  );
}

function VariantSelector({
  variants,
  selectedId,
  onSelect
}: {
  variants: ResourceVariant[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="variant-selector" aria-label="资源选择">
      {variants.map((variant) => (
        <button
          key={variant.id}
          className={variant.id === selectedId ? "variant-card is-selected" : "variant-card"}
          type="button"
          onClick={() => onSelect(variant.id)}
        >
          <span>{variant.actionLabel}</span>
          <strong>{variant.label}</strong>
          <small>
            {[variant.height ? `${variant.height}p` : null, variant.fps ? `${variant.fps}fps` : null, variant.container, formatBytes(variant.sizeBytes)]
              .filter(Boolean)
              .join(" / ") || "参数由源站决定"}
          </small>
          <em>{variant.hasAudio ? "包含音频" : "不含音频"}</em>
        </button>
      ))}
    </div>
  );
}

function DownloadComposer({
  manifest,
  selectedVariant,
  createTask,
  updateTask
}: {
  manifest: Manifest;
  selectedVariant: ResourceVariant;
  createTask: CreateTask;
  updateTask: UpdateTask;
}) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [activeMergeTaskId, setActiveMergeTaskId] = useState<string | null>(null);
  const cancelMergeRef = useRef(false);
  const videoTrack = findTrack(manifest, selectedVariant.videoTrackId);
  const audioTrack = findTrack(manifest, selectedVariant.audioTrackId);
  const combinedTrack = findTrack(manifest, selectedVariant.combinedTrackId);
  const ffmpegCommand = videoTrack && audioTrack ? buildFfmpegMergeCommand(videoTrack.url, audioTrack.url, `${manifest.title}.mp4`) : null;

  async function copyText(text: string, label = "已复制") {
    await navigator.clipboard.writeText(text);
    setCopyMessage(label);
    window.setTimeout(() => setCopyMessage(null), 1800);
  }

  function startDirectDownload() {
    const track = combinedTrack ?? videoTrack;
    if (!track) {
      createTask({
        label: selectedVariant.label,
        status: "failed",
        detail: "当前选项没有可直接打开的媒体轨道。"
      });
      return;
    }

    const taskId = createTask({
      label: selectedVariant.label,
      status: "waiting",
      detail: "正在把源站直链交给浏览器。"
    });

    const anchor = document.createElement("a");
    anchor.href = track.url;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.download = `${manifest.title}.${track.container ?? "mp4"}`;
    anchor.click();

    updateTask(taskId, {
      status: "completed",
      detail: "已打开源站直链。真实下载进度由浏览器或源站页面管理，服务器不接管文件。"
    });
  }

  async function startBrowserMerge() {
    const taskId = createTask({
      label: selectedVariant.label,
      status: "waiting",
      detail: "正在检查浏览器合并能力和源站 CORS。"
    });
    setActiveMergeTaskId(taskId);
    cancelMergeRef.current = false;

    const check = await checkBrowserMerge(videoTrack, audioTrack);
    if (!check.ok) {
      updateTask(taskId, { status: "failed", detail: check.message });
      setActiveMergeTaskId(null);
      return;
    }

    if (!videoTrack || !audioTrack) {
      updateTask(taskId, { status: "failed", detail: "当前选项缺少视频轨道或音频轨道。" });
      setActiveMergeTaskId(null);
      return;
    }

    try {
      updateTask(taskId, { status: "downloading", detail: "正在把源站媒体读取到本机浏览器。" });
      const blob = await mergeTracksWithFfmpeg(videoTrack, audioTrack, (message) => {
        if (cancelMergeRef.current) return;
        const nextStatus: TaskStatus = /获取|fetch|write/i.test(message) ? "downloading" : "merging";
        updateTask(taskId, { status: nextStatus, detail: message });
      });

      if (cancelMergeRef.current) {
        updateTask(taskId, {
          status: "cancelled",
          detail: "已取消保存合并结果；浏览器底层任务可能已经完成但不会自动下载。"
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${manifest.title}.mp4`;
      anchor.click();
      URL.revokeObjectURL(url);
      updateTask(taskId, { status: "completed", detail: "合并完成，文件已交给浏览器保存。" });
    } catch (error) {
      updateTask(taskId, {
        status: "failed",
        detail: error instanceof Error ? error.message : "浏览器本地合并失败，请改用本地工具命令。"
      });
    } finally {
      setActiveMergeTaskId(null);
      cancelMergeRef.current = false;
    }
  }

  function cancelMerge() {
    if (!activeMergeTaskId) return;
    cancelMergeRef.current = true;
    updateTask(activeMergeTaskId, {
      status: "cancelled",
      detail: "已请求取消。已开始的 WebAssembly 合并无法强制中断，但不会继续保存结果。"
    });
    setActiveMergeTaskId(null);
  }

  const showDirect = selectedVariant.action === "direct-save" || selectedVariant.action === "browser-merge";
  const showMerge = selectedVariant.action === "browser-merge";

  return (
    <section className="download-composer">
      <div className="composer-head">
        <div>
          <span className="panel-kicker">Download Composer</span>
          <h3>下载与本地合并</h3>
          <p>
            当前选项：{selectedVariant.label}。{selectedVariant.needsMerge ? "该资源需要音视频合并。" : "该资源通常可以直接下载。"}
          </p>
        </div>
        {copyMessage ? <span className="copy-toast">{copyMessage}</span> : null}
      </div>

      <div className="composer-actions">
        {showDirect ? (
          <button className="primary-button" type="button" onClick={startDirectDownload}>
            打开源站直链
          </button>
        ) : null}
        {showMerge ? (
          <button className="primary-button secondary" type="button" onClick={startBrowserMerge} disabled={Boolean(activeMergeTaskId)}>
            浏览器本地合并
          </button>
        ) : null}
        {activeMergeTaskId ? (
          <button className="ghost-button" type="button" onClick={cancelMerge}>
            取消任务
          </button>
        ) : null}
      </div>

      <div className="truth-note">
        直链下载不会经过本站服务器。若源站要求请求头、Cookie 或阻止跨域读取，浏览器直链或本地合并可能失败，请改用本地工具命令。
      </div>

      <details className="command-details">
        <summary>本地工具命令与媒体轨道</summary>
        <div className="command-stack">
          {ffmpegCommand ? (
            <div>
              <div className="command-title">
                <strong>ffmpeg 合并命令</strong>
                <button className="ghost-button" type="button" onClick={() => copyText(ffmpegCommand, "已复制 ffmpeg 命令")}>
                  复制
                </button>
              </div>
              <pre>{ffmpegCommand}</pre>
            </div>
          ) : null}

          {manifest.fallbacks.map((fallback) => (
            <div key={fallback.id}>
              <div className="command-title">
                <strong>{fallback.label}</strong>
                <button className="ghost-button" type="button" onClick={() => copyText(fallback.command, "已复制命令")}>
                  复制
                </button>
              </div>
              {fallback.containsSensitiveData ? <p className="inline-warning">命令可能依赖你本地的 cookies.txt，请不要分享。</p> : null}
              <pre>{fallback.command}</pre>
            </div>
          ))}

          {[videoTrack, audioTrack, combinedTrack].filter(Boolean).map((track) => (
            <pre key={(track as Track).id}>{trackKindLabels[(track as Track).kind]}: {(track as Track).url}</pre>
          ))}
        </div>
      </details>
    </section>
  );
}

function TrackSelector({
  manifest,
  createTask,
  updateTask
}: {
  manifest: Manifest;
  createTask: CreateTask;
  updateTask: UpdateTask;
}) {
  const model = useMemo(() => buildResourceModel(manifest), [manifest]);
  const [selectedId, setSelectedId] = useState(model.variants[0]?.id ?? "");
  const selectedVariant = model.variants.find((variant) => variant.id === selectedId) ?? model.variants[0];

  if (!selectedVariant) {
    return (
      <section className="result-panel">
        <ResolveErrorView
          error={{
            kind: "no-downloadable-resource",
            title: "没有可下载资源",
            message: "解析器返回了视频信息，但没有返回可用轨道或下载选项。",
            nextAction: "换一个公开链接重试，或使用本地 yt-dlp 工具排查。",
            retry: false
          }}
        />
      </section>
    );
  }

  return (
    <section className="result-panel">
      <div className="section-heading compact">
        <span className="section-kicker">Track Selector</span>
        <h2>选择清晰度、格式和处理方式</h2>
        <p>这里展示的是后端真实返回的资源清单。当前接口不返回字幕轨道时，不会生成虚假的字幕选项。</p>
      </div>

      <VariantSelector variants={model.variants} selectedId={selectedVariant.id} onSelect={setSelectedId} />

      <div className="selected-resource" aria-label="当前选择的资源摘要">
        <div>
          <span>当前输出</span>
          <strong>{selectedVariant.label}</strong>
        </div>
        <div>
          <span>容器</span>
          <strong>{selectedVariant.container ?? "接口未返回"}</strong>
        </div>
        <div>
          <span>音频</span>
          <strong>{selectedVariant.hasAudio ? "包含或已关联" : "不含音频"}</strong>
        </div>
        <div>
          <span>合并</span>
          <strong>{selectedVariant.needsMerge ? "需要本地合并" : "无需合并"}</strong>
        </div>
      </div>

      <div className="tracks-grid">
        <TrackTable title="视频轨道" tracks={model.videoTracks} empty="当前接口没有返回独立视频轨道。" />
        <TrackTable title="音频轨道" tracks={model.audioTracks} empty="当前接口没有返回独立音频轨道。" />
        <TrackTable title="已合并 / 流媒体" tracks={[...model.combinedTracks, ...model.streamTracks]} empty="当前接口没有返回已合并资源或流媒体入口。" />
      </div>

      {model.subtitleTracks.length ? (
        <TrackTable title="字幕轨道" tracks={model.subtitleTracks} empty="当前接口没有返回字幕轨道。" />
      ) : (
        <p className="truth-note">字幕轨道：当前后端 manifest 类型没有字幕字段，本页不会伪造字幕下载能力。</p>
      )}

      <DownloadComposer manifest={manifest} selectedVariant={selectedVariant} createTask={createTask} updateTask={updateTask} />
    </section>
  );
}

function TaskCenter({ tasks }: { tasks: DownloadTask[] }) {
  return (
    <section id="tasks" className="task-center">
      <div className="section-heading compact">
        <span className="section-kicker">Task Center</span>
        <h2>当前和最近任务</h2>
        <p>解析、直链下载和浏览器合并的状态会显示在这里；服务器不会替你保存视频文件。</p>
      </div>

      {tasks.length ? (
        <div className="task-list" aria-live="polite">
          {tasks.map((task) => (
            <article className={`task-item is-${task.status}`} key={task.id}>
              <span>{taskStatusLabels[task.status]}</span>
              <div>
                <strong>{task.label}</strong>
                <p>{task.detail}</p>
              </div>
              <time>{new Date(task.createdAt).toLocaleTimeString()}</time>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-task">
          <strong>还没有下载或合并任务</strong>
          <p>解析成功后，选择一个资源并开始下载，本区域会记录状态。</p>
        </div>
      )}
    </section>
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <div className="warning-panel">
      <strong>解析器提示</strong>
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </div>
  );
}

export function UniversalResolverWorkspace({ loggedIn, livePlatforms, plannedPlatforms }: UniversalResolverWorkspaceProps) {
  const [url, setUrl] = useState("");
  const [cookieExpanded, setCookieExpanded] = useState(false);
  const [temporaryCookie, setTemporaryCookie] = useState("");
  const [lastCookiePreview, setLastCookiePreview] = useState("");
  const [state, setState] = useState<ResolveState>({ status: "idle", step: "等待输入链接" });
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(livePlatforms[0]?.id ?? "youtube");
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const taskCounterRef = useRef(0);
  const detection = useMemo(() => detectInputPlatform(url), [url]);
  const validationError = useMemo(() => validationErrorFromDetection(detection), [detection]);
  const allCapabilities = useMemo(() => [...livePlatforms, ...plannedPlatforms], [livePlatforms, plannedPlatforms]);
  const activeCapability = detection.capability ?? allCapabilities.find((platform) => platform.id === selectedModuleId);
  const activePlatformId = detection.platformId ?? selectedModuleId;
  const runtimeUnavailable = runtimeStatus ? !runtimeStatus.resolverReady : false;
  const runtimeError: ClassifiedResolveError | null = runtimeUnavailable
    ? {
        kind: "server-config",
        title: "服务器解析组件未就绪",
        message: "服务器尚未安装视频解析组件，请联系管理员完成配置。",
        nextAction: "管理员需要安装 yt-dlp，并确认服务进程可以通过 YTDLP_PATH 或 PATH 找到它。",
        retry: false
      }
    : null;
  const canSubmit = detection.canResolve && state.status !== "loading" && !runtimeUnavailable;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/runtime", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: RuntimeStatus) => {
        if (!cancelled) setRuntimeStatus(payload);
      })
      .catch(() => {
        if (!cancelled) setRuntimeStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function createTask(task: Omit<DownloadTask, "id" | "createdAt">) {
    taskCounterRef.current += 1;
    const id = `task-${Date.now()}-${taskCounterRef.current}`;
    setTasks((current) => [{ ...task, id, createdAt: Date.now() }, ...current].slice(0, 8));
    return id;
  }

  function updateTask(id: string, patch: Partial<Omit<DownloadTask, "id" | "createdAt">>) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }

  function cancelResolve() {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({
      status: "error",
      step: "解析已取消",
      error: {
        kind: "network",
        title: "解析已取消",
        message: "本次解析请求已被取消。",
        nextAction: "你可以修改链接、Cookie 或稍后重新解析。",
        retry: true
      }
    });
  }

  async function submitResolve(event?: FormEvent) {
    event?.preventDefault();
    const clientError = runtimeError ?? validationErrorFromDetection(detection);
    if (clientError) {
      setState({ status: "error", step: clientError.title, error: clientError });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const cookieForRequest = loggedIn && temporaryCookie.trim() ? temporaryCookie.trim() : "";
    if (cookieForRequest) {
      setLastCookiePreview(redactCookieForDisplay(cookieForRequest));
      setTemporaryCookie("");
    }

    setState({ status: "loading", step: "正在请求解析器" });

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          temporaryCookie: cookieForRequest || undefined
        }),
        signal: controller.signal
      });

      setState({ status: "loading", step: "正在读取解析结果" });
      const payload = (await response.json().catch(() => null)) as ResolvePayload | null;

      if (!payload || !payload.ok) {
        const error = classifyResolveError(payload?.error ?? `HTTP ${response.status}`);
        setState({ status: "error", step: error.title, error });
        return;
      }

      if (!payload.manifest.tracks.length || !payload.manifest.variants.length) {
        const error = classifyResolveError("没有可下载资源");
        setState({ status: "error", step: error.title, error });
        return;
      }

      setState({
        status: "success",
        step: "解析完成",
        manifest: payload.manifest
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const classified = classifyResolveError(error instanceof Error ? error.message : "network error");
      setState({ status: "error", step: classified.title, error: classified });
    } finally {
      abortRef.current = null;
      if (cookieForRequest) setTemporaryCookie("");
    }
  }

  return (
    <>
      <section id="resolver" className="resolver-hero">
        <div className="hero-copy-v2">
          <span className="section-kicker">服务器不代下载视频</span>
          <h1>万能视频解析工作台</h1>
          <p>
            粘贴公开视频链接，服务器只返回媒体元数据和可用资源清单；下载、保存和可行的音视频合并都在用户自己的浏览器或设备中完成。
          </p>
          <div className="hero-facts" aria-label="核心规则">
            <span>YouTube / Bilibili / X</span>
            <span>Cookie 临时使用</span>
            <span>不保存视频文件</span>
            <span>不绕过 DRM</span>
          </div>
        </div>

        <div className="resolver-layout">
          <PlatformRail
            livePlatforms={livePlatforms}
            plannedPlatforms={plannedPlatforms}
            activePlatformId={activePlatformId}
            onSelect={setSelectedModuleId}
          />

          <div className="resolver-main">
            <AccessPanel loggedIn={loggedIn} />

            <form className="resolver-card" onSubmit={submitResolve}>
              <div className="card-heading">
                <div>
                  <span className="panel-kicker">Resolver Workspace</span>
                  <h2>粘贴链接并解析资源</h2>
                </div>
                <span className="privacy-pill">Cookie 不持久化</span>
              </div>

              <PlatformDetector detection={detection} />

              {runtimeError ? <ResolveErrorView error={runtimeError} /> : null}

              {activeCapability ? (
                <div className="module-brief">
                  <strong>{activeCapability.label} 模块</strong>
                  <span>{activeCapability.resolveEnabled ? activeCapability.statusLabel : "计划接入，当前不请求解析器"}</span>
                  <p>{activeCapability.notes}</p>
                </div>
              ) : null}

              <label className="field-block" htmlFor="video-url">
                <span>视频链接</span>
                <div className="input-row">
                  <input
                    id="video-url"
                    className="text-input"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    onInput={(event) => setUrl(event.currentTarget.value)}
                    placeholder="https://x.com/... 或 https://www.bilibili.com/video/..."
                    autoComplete="off"
                    disabled={state.status === "loading"}
                  />
                  <button className="primary-button" type="submit" disabled={!canSubmit}>
                    {state.status === "loading" ? "解析中" : "开始解析"}
                  </button>
                </div>
              </label>

              {validationError && url.trim() ? (
                <ResolveErrorView error={validationError} />
              ) : null}

              <div className="cookie-shell">
                <button
                  className="cookie-toggle"
                  type="button"
                  onClick={() => setCookieExpanded((value) => !value)}
                  aria-expanded={cookieExpanded}
                >
                  <span>平台 Cookie（可选）</span>
                  <strong>{cookieExpanded ? "收起" : "展开"}</strong>
                </button>

                {cookieExpanded ? (
                  <div className="cookie-panel">
                    {loggedIn ? (
                      <>
                        <textarea
                          className="text-area"
                          value={temporaryCookie}
                          onChange={(event) => setTemporaryCookie(event.target.value)}
                          onInput={(event) => setTemporaryCookie(event.currentTarget.value)}
                          placeholder="粘贴对应视频平台的 Cookie 请求头，或 cookies.txt / Netscape 导出内容。"
                          disabled={state.status === "loading"}
                        />
                        <p>
                          这里填的是视频平台账号 Cookie，不是本站访问码。内容只随本次解析请求发送，提交后前端会立即清空，不写入 localStorage，不放进 URL。
                        </p>
                        {lastCookiePreview ? <small>上次提交后已清空：{lastCookiePreview}</small> : null}
                      </>
                    ) : (
                      <p>需要先用本站访问码解锁，才允许输入临时平台 Cookie。公开链接仍可直接解析。</p>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="resolver-footnote">
                <span>支持状态：{detection.capability?.statusLabel ?? "等待识别"}</span>
                <span>
                  运行状态：
                  {runtimeStatus
                    ? runtimeStatus.resolverReady
                      ? "解析组件已就绪"
                      : "服务端依赖缺失"
                    : "正在检测"}
                  。隐私：本站不保存 Cookie 和视频文件；后端安全处理以代码审计为准。
                </span>
              </div>
            </form>

            {state.status === "loading" ? <LoadingState step={state.step} onCancel={cancelResolve} /> : null}
            {state.status === "error" && state.error && !validationError ? (
              <ResolveErrorView error={state.error} onRetry={() => submitResolve()} />
            ) : null}
          </div>
        </div>
      </section>

      {state.status === "success" && state.manifest ? (
        <section className="results-zone">
          <Warnings warnings={state.manifest.warnings} />
          <MediaSummary manifest={state.manifest} capability={activeCapability} />
          <TrackSelector manifest={state.manifest} createTask={createTask} updateTask={updateTask} />
        </section>
      ) : null}

      <TaskCenter tasks={tasks} />
    </>
  );
}
