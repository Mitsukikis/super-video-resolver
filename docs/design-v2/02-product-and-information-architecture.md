# 02 Product And Information Architecture

## V2 Product Definition

V2 is a platform-aware video resolver workspace. It should feel like a focused control surface: compact, trustworthy, fast to scan, and explicit about privacy.

Primary promise:

> The server returns a media manifest only. Source media traffic, downloading, and browser merging stay on the user's device.

Secondary promise:

> Temporary platform Cookie is used only for the current resolve request and is not persisted.

## First Screen Decision

The first-screen intro and resolver workspace should be **merged in the first viewport**, not separated vertically.

Reason:

- This is a tool app, not a landing page.
- The user already arrives with a link and wants to act quickly.
- Trust messaging matters, but it can live in compact status bars and explanation rows beside the tool.
- Separating intro above workspace would repeat the current V1 issue: the main operation starts too low.

Recommended first viewport composition:

```text
Top navigation
└─ brand, supported/live status, access state, privacy anchor

Main workspace
├─ left platform rail
├─ central resolver command panel
│  ├─ compact product promise
│  ├─ URL input and parse button
│  ├─ temporary Cookie drawer/field
│  └─ resolve status
└─ right/secondary inspector on desktop
   ├─ current platform requirements
   ├─ privacy summary
   └─ common recovery actions
```

Results appear in the same workspace below or beside the command panel, not as a disconnected card stack.

## Recommended Page Structure

1. **Top Navigation**
   - Brand: 超级视频解析
   - Current capability badges: 不代下载, 不保存 Cookie, 浏览器本机合并
   - Access state: 访客 / 已授权
   - Anchor links: 支持平台, 工作原理, FAQ

2. **First Viewport Workspace**
   - Compact brand promise, not a marketing hero.
   - Platform rail.
   - Resolver command center.
   - Platform/Cookie inspector.
   - Resolve progress state.

3. **Resolve Status Area**
   - Idle tips.
   - URL validation.
   - Resolving timeline.
   - Error recovery actions.
   - Partial success warnings.

4. **Resolved Resource Workspace**
   - Media summary: title, author, duration, platform, thumbnail.
   - Resource tabs: 推荐, 视频, 音频, 字幕/流, 本地命令.
   - Track table: quality, codec, container, size, FPS, action.
   - Variant selector: direct, browser merge, local tool.
   - Safety warnings for sensitive commands.

5. **Download And Local Merge Tasks**
   - Direct link action.
   - Browser merge task state.
   - Local command copy state.
   - Cancel, retry, completed status.

6. **Supported Platforms**
   - Live: YouTube, Bilibili, X / Twitter.
   - Planned: Douyin, Xiaohongshu, Weibo.
   - Each platform shows domains, Cookie need, browser merge likelihood, output types, and current status.

7. **Privacy And How It Works**
   - Server only resolves metadata and direct URLs.
   - Cookie is temporary.
   - Media transfer remains between user browser/local tools and source site.
   - No DRM, paid-content, private-content bypassing.

8. **FAQ**
   - Why do I need Cookie?
   - Why does X/Twitter say no video found?
   - Why does browser merge fail?
   - Does the server save my video?
   - What platforms are actually supported?

9. **Footer**
   - Short safety statement.
   - Supported platform status.
   - GitHub/project link only if approved.

## Information Architecture Map

```text
Home
├─ TopNav
├─ ResolverWorkspace
│  ├─ PlatformRail
│  ├─ CommandCenter
│  │  ├─ URLInput
│  │  ├─ CookieInputPanel
│  │  └─ ResolveStatusPanel
│  ├─ PlatformInspector
│  └─ ResultWorkspace
│     ├─ ManifestSummary
│     ├─ ResourceTabs
│     ├─ TrackTable
│     ├─ VariantSelector
│     └─ DownloadTaskPanel
├─ SupportedPlatforms
├─ PrivacyExplainer
├─ FAQ
└─ Footer
```

## Platform Information Architecture

### Live Platforms

- YouTube
  - Status: 支持
  - Cookie: 某些内容需要
  - Browser merge: mixed
  - Output: combined, split, HLS/DASH depending on source

- Bilibili
  - Status: 支持
  - Cookie: 某些清晰度或内容需要
  - Browser merge: unlikely to mixed, depends on source restrictions
  - Output: combined/split/stream depending on yt-dlp result

- X / Twitter
  - Status: 支持但易受帖子类型和登录态影响
  - Cookie: often helpful for sensitive/login-visible posts
  - Browser merge: unlikely
  - Common error: no downloadable video in tweet, quote post, private/sensitive content

### Planned Platforms

- Douyin: 待接入
- Xiaohongshu: 待接入
- Weibo: 待接入

These can be listed for roadmap transparency but must not have active parse claims until backend support exists.

## Key User Flows

### Public Resolve Flow

```text
Open page -> select/auto-detect platform -> paste URL -> resolve -> inspect tracks -> choose direct/browser/local action
```

### Cookie-Assisted Resolve Flow

```text
Open page -> unlock site access -> paste URL -> open Cookie panel -> paste platform Cookie -> resolve -> inspect warnings -> choose action
```

### Failure Recovery Flow

```text
Error shown -> explain likely cause -> keep input -> provide next actions:
retry / add Cookie / switch platform / copy local yt-dlp command / read platform FAQ
```

### Browser Merge Flow

```text
Select split variant -> check browser capability -> load ffmpeg.wasm -> fetch tracks -> merge -> save blob -> show completion or fallback command
```

