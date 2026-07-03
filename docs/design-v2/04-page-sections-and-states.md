# 04 Page Sections And States

## Page Sections

### 1. Top Navigation

Purpose:

- Identify product.
- Show authorization status.
- Provide anchors to supported platforms, privacy, FAQ.

Content:

- Brand: 超级视频解析
- Badges: 不代下载, 临时 Cookie, 本机合并
- Auth state: 访客 / 已授权

### 2. First Viewport Workspace

Purpose:

- Let users resolve immediately.
- Explain the privacy boundary in one scan.

Layout:

- Left: platform rail.
- Center: command center.
- Right: platform inspector on desktop.

### 3. Resolve Status

Purpose:

- Show what is happening after submit.
- Provide recoverable next steps when errors occur.

### 4. Result Resource Workspace

Purpose:

- Turn `Manifest` into an actionable resource table.
- Let users compare variants, tracks, and fallback commands.

Tabs:

- 推荐
- 视频
- 音频
- 字幕/流
- 本地命令

Note: current schema has no dedicated subtitle track kind. The "字幕/流" tab should display HLS/DASH streams and leave subtitles as "待接口支持" unless backend adds subtitle tracks later.

### 5. Download And Merge Tasks

Purpose:

- Show direct download, browser merge, local command, progress, cancel/retry, and completion.

### 6. Supported Platforms

Purpose:

- Make real support transparent.
- Prevent false claims for Douyin, Xiaohongshu, and Weibo.

### 7. Privacy And Work Principle

Purpose:

- Explain server boundary, Cookie handling, and media traffic path.

### 8. FAQ

Purpose:

- Resolve common confusion without bloating the first viewport.

### 9. Footer

Purpose:

- Repeat safety boundary and version/platform status.

## Page State Matrix

| State | User sees | Next action | Component | Retry | Keep input |
| --- | --- | --- | --- | --- | --- |
| Initial empty | Platform rail, empty URL input, compact privacy promise, "粘贴链接开始解析" tip | Paste URL, choose platform, unlock Cookie input if needed | `ResolverWorkspace`, `PlatformRail`, `CommandCenter` | Not applicable | Yes |
| Resolving | Progress rail: 校验链接 -> 识别平台 -> 请求解析器 -> 整理媒体清单 | Wait, cancel if implemented, read privacy note | `ResolveStatusPanel` | Cancel/retry after finish | Yes |
| Success | Manifest summary, resource tabs, variant selector, download/merge actions | Choose quality/action, download, merge, copy command | `ResultWorkspace`, `TrackTable`, `DownloadTaskPanel` | Resolve again allowed | Yes |
| Partial success | Result workspace plus amber warning: some tracks missing or source restrictions | Use available resources, copy local command, retry with Cookie | `ResultWorkspace`, `WarningStrip` | Yes | Yes |
| Link format error | Inline error near URL: not HTTP/HTTPS or empty/invalid URL | Fix URL, paste again | `InlineFieldError`, `ResolveErrorPanel` | Yes | Yes |
| Platform unsupported | Error panel with supported/planned platform list | Paste supported link, choose supported platform, read platform list | `ResolveErrorPanel`, `SupportedPlatformsMini` | Yes | Yes |
| Cookie missing | Message: this content may require platform Cookie; site access may be needed to unlock Cookie field | Unlock access, paste platform Cookie, retry | `CookieRequirementPanel`, `AccessGate` | Yes | Yes |
| Cookie invalid | Error: platform rejected Cookie or auth failed | Re-export Cookie, clear Cookie field, retry public mode | `CookieErrorPanel` | Yes | Yes, but allow clear |
| Login content inaccessible | Error: content is private/sensitive/login-visible or not available to this account | Check source post, use own authorized Cookie, or stop | `ResolveErrorPanel` | Conditional | Yes |
| Network timeout | Timeout state after `RESOLVE_TIMEOUT_MS` | Retry, try local yt-dlp command, check proxy/server status | `TimeoutPanel`, `FallbackCommandPanel` | Yes | Yes |
| Downloading | Direct link opened or download action initiated; browser may show native download | Open direct link again, copy URL/command | `DownloadTaskPanel` | Yes | Yes |
| Browser merging | ffmpeg.wasm progress: loading engine, fetching tracks, merging %, saving | Wait, cancel if supported, copy fallback command | `MergeProgressPanel` | Yes after failure/cancel | Yes |
| Download complete | Success chip and saved/initiated message | Resolve another link, open output, copy command | `TaskCompleteState` | Not needed | Yes |
| User cancelled task | Neutral cancelled state; no error tone | Resume/retry, change variant, copy local command | `TaskCancelledState` | Yes | Yes |

## Error Copy Principles

- Say what happened in plain Chinese.
- Separate cause from next action.
- Do not imply bypassing access control.
- Keep the previous URL and Cookie visible unless the user clears them.
- Provide at least one recoverable action when possible.

## Progress Step Design

Use a compact vertical or horizontal stepper:

1. 校验链接
2. 识别平台
3. 请求解析器
4. 整理媒体清单
5. 准备下载方式

Each step has one of: waiting, active, complete, warning, error.

## Result Resource Design

Recommended table columns:

- 类型: video/audio/combined/HLS/DASH
- 清晰度: height/FPS/bitrate
- 编码: codec
- 容器: container
- 大小: size if available
- 动作: direct/browser merge/local command/unsupported

On mobile, table rows become resource cards with the same fields.

