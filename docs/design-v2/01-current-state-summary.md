# 01 Current State Summary

## Scope

This document summarizes the current V1 page and defines what must be preserved before designing V2. It is based on:

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/*`
- `src/lib/*`
- `src/app/api/*`
- `README.md`
- `package.json`
- `docs/design-research/*`
- `references/current-version.png`
- `docs/design-research/keyframes/scene-contact-sheet.jpg`

No business code is changed in this design stage.

## Product Positioning

The product is a utility web app for resolving video links into downloadable media manifests. Its visual design must serve the task:

1. Paste a video link.
2. Optionally provide temporary platform Cookie.
3. Resolve the link.
4. Inspect video, audio, subtitle or stream resources where available.
5. Choose format and quality.
6. Download directly from source or merge locally in the browser.
7. Understand progress, errors, privacy, and server boundaries.

The site must not become a pure visual showcase. It must not imply server-side proxying, persistent Cookie storage, DRM bypassing, paid-content bypassing, or hidden platform support.

## Current Structure Worth Keeping

- **Single-page app shell**: good for a focused tool and avoids unnecessary routing in V2.
- **Clear safety promise**: "服务器不代下载、不保存、不代理" is the strongest trust asset.
- **Server/client split**: `HomePage` fetches `loggedIn` server-side, while resolver and merge actions remain client-side.
- **Temporary Cookie wording**: current copy correctly distinguishes site access code from platform Cookie.
- **Manifest model**: `Manifest`, `Track`, `Variant`, and `Fallback` are a good contract for V2 results.
- **Browser merge capability**: `DownloadPanel` and `browserMerge.ts` already represent the core local-merge promise.
- **Canvas background with reduced-motion support**: `ParticleField` can remain if toned down and visually deprioritized.
- **Test base**: existing Vitest coverage gives a foundation for type and logic confidence.

## Five Most Serious Visual Problems

1. **The hero takes too much visual authority**  
   The largest surface is explanatory copy, while the input workflow sits lower and to the right. For a tool, the primary action should dominate the first scan.

2. **Hierarchy is too even**  
   Hero, auth panel, resolver panel, result cards, and download panels all share similar borders, glass, blur, and shadows. Nothing clearly says "start here, then inspect here".

3. **The palette leans too much on teal glow**  
   Teal particles, teal borders, teal focus, and teal action buttons create a one-note control-console look. Status colors and platform states need a wider, functional palette.

4. **Card language can scale poorly**  
   The current layout uses cards for every region. If V2 adds platform nav, track tables, progress, FAQ, privacy, and tasks without stronger structure, it will become card-heavy.

5. **Typography relies on size, not system**  
   The current `Arial, Helvetica, sans-serif` stack works but lacks a deliberate Chinese/English hierarchy. Text density, labels, captions, and code outputs need clearer sizing and weight rules.

## Five Most Serious Interaction Problems

1. **No platform workspace**  
   Users cannot switch or inspect platform-specific requirements before resolving. X/Twitter, Bilibili, YouTube, and planned platforms need visible status.

2. **Cookie flow is not modular enough**  
   Site access code and platform Cookie are explained, but they are not separated into a workflow model that can scale to multiple platforms.

3. **Error recovery is too thin**  
   Errors are plain messages. V2 needs next actions: retry, add Cookie, check link, switch platform, copy local command, or read platform limitations.

4. **Results are appended rather than promoted**  
   After success, the result appears below the form instead of becoming a resource workspace with track filters, variants, tasks, and safety notes.

5. **Download and merge task state is local and narrow**  
   Browser merge progress exists, but V2 needs a unified task model for direct link open, browser merge, local command copy, complete state, and cancellation.

## CSS-Only Improvements

These can be addressed largely in `src/app/globals.css` after V2 design approval:

- Replace current color variables with complete V2 design tokens.
- Reduce global glow, blur, and heavy shadows.
- Tighten typography, line-height, label size, and code block styles.
- Improve focus rings, disabled states, warning/error blocks, and button states.
- Add responsive grid rules and stable dimensions for tool panels.
- Reduce particle background visual weight and scanline intensity.

## Component-Structure Improvements

These require component changes in implementation mode:

- Split `ResolverForm` into platform selection, link input, Cookie panel, status panel, and result handoff.
- Split `ResultView` into media summary, track table, variant selector, warning panel, and result actions.
- Split `DownloadPanel` into direct download action, browser merge task, local command panel, and task status.
- Convert `CapabilityStrip` from static claims into platform/status capability data.
- Convert `LoginPanel` into a smaller access/auth control that can sit in top nav or side inspector.
- Introduce a workspace component to own URL, platform selection, resolve state, selected variant, and task state.

## Potential State Management Needs

V2 can remain on React local state and `useReducer`; no new state library is required.

Likely state domains:

- `selectedPlatform`: UI filter only unless detection confirms a platform.
- `url`: current input, retained across errors.
- `temporaryCookie`: client-only form state, never persisted.
- `resolveState`: idle, validating, resolving, success, partial-success, error.
- `resolveError`: typed UI error mapped from API messages.
- `selectedVariantId`: resource selection.
- `downloadTask`: idle, downloading, merging, complete, cancelled, failed.
- `progressMessages`: merge logs and progress messages.

No backend contract change is required to implement most V2 states. Some states such as "partial success" can be inferred from `manifest.warnings`, missing tracks, unsupported variants, or merge capability checks.

## Backend Interfaces And Data Structures To Preserve

Keep these unchanged in V2 implementation unless separately approved:

- `POST /api/login`
  - Input: `{ accessCode }`
  - Output: `{ ok: true }` or `{ ok: false, error }`
  - Sets `svr_session` HTTP-only Cookie.

- `POST /api/logout`
  - Deletes `svr_session`.

- `POST /api/resolve`
  - Input: `{ url, temporaryCookie? }`
  - Output success: `{ ok: true, manifest }`
  - Output failure: `{ ok: false, error }`

- `ManifestSchema`
  - `sourceUrl`, `platform`, `title`, `author`, `durationSeconds`, `thumbnailUrl`, `expiresAt`
  - `variants`, `tracks`, `warnings`, `fallbacks`

- `TrackSchema`
  - `kind`: `video | audio | combined | hls | dash`
  - URL, codec, bitrate, dimensions, FPS, size, headers, expiration.

- `VariantSchema`
  - `kind`: `combined | split | stream`
  - `action`: `direct-save | browser-merge | local-tool | unsupported`

- Platform support in code remains `x`, `bilibili`, `youtube`.
  - Douyin, Xiaohongshu, and Weibo can appear only as "待接入" in V2 UI until real resolvers exist.

