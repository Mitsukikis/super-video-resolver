# Current Capability Matrix

Generated before V2 implementation on branch `feat/universal-video-resolver-v2`.

## Frontend Stack

| Area | Current capability | Status |
| --- | --- | --- |
| Framework | Next.js 15 App Router, React 19, TypeScript | 已真实支持 |
| Styling | Global CSS in `src/app/globals.css`, CSS variables, responsive media queries | 已真实支持 |
| Client merge | `@ffmpeg/ffmpeg` and `@ffmpeg/util` in browser | 已真实支持, 受 CORS 和浏览器能力限制 |
| Tests | Vitest + jsdom | 已真实支持 |
| Lint | No `lint` npm script in `package.json` | 尚未实现 |

## Backend Interfaces

| Interface | Current behavior | Status |
| --- | --- | --- |
| `POST /api/resolve` | Accepts `{ url, temporaryCookie? }`; returns `{ ok: true, manifest }` or `{ ok: false, error }` | 已真实支持 |
| `POST /api/login` | Accepts `{ accessCode }`; sets HTTP-only `svr_session` when valid | 已真实支持 |
| `POST /api/logout` | Deletes `svr_session` | 已真实支持 |
| Progress API | No streaming or percentage progress from backend | 尚未实现 |
| Structured error codes | API currently returns one error string | 尚未实现 |

## Real Platform Support

| Platform | Detection | Resolver | Cookie support | Support level | Notes |
| --- | --- | --- | --- | --- | --- |
| YouTube | `youtube.com`, `youtu.be`, subdomains | `yt-dlp` | Temporary header or Netscape cookie file after site authorization | 已真实支持 / 部分受 Cookie 限制 | Browser merge can be mixed because source/CORS varies. |
| Bilibili | `bilibili.com`, subdomains | `yt-dlp` | Temporary header or Netscape cookie file after site authorization | 已真实支持 / 部分受 Cookie 限制 | Some quality/content can require account state. |
| X / Twitter | `x.com`, `twitter.com`, Twitter subdomains | `yt-dlp` | Temporary header or Netscape cookie file after site authorization | 已真实支持 / 有限支持 / 经常受 Cookie 限制 | Some posts have no downloadable video, are quote posts, private, sensitive, or login-visible. |
| Douyin | None | None | None | 尚未实现 | Must not be shown as parseable. |
| Xiaohongshu | None | None | None | 尚未实现 | Must not be shown as parseable. |
| Weibo | None | None | None | 尚未实现 | Must not be shown as parseable. |
| Unknown links | Returns `null` from `detectPlatform` | No resolver | None | 尚未实现 | UI must show "无法识别" and not submit by default. |

## Platform Detection Logic

Current detection lives in `src/lib/platform.ts`.

- `normalizeInputUrl(input)` trims, adds `https://` when protocol is missing, and rejects non-HTTP(S).
- `detectPlatform(url)` maps hostnames to `youtube`, `bilibili`, or `x`.
- Unsupported platforms return `null`.

V2 should keep this business source of truth and add a frontend capability registry that references the same supported ids.

## Cookie, Access Code, And Authorization

| Capability | Current behavior | Status |
| --- | --- | --- |
| Site access code | Checked by `/api/login` against `process.env.ACCESS_CODE` | 已真实支持 |
| Session | HTTP-only `svr_session`, signed with `AUTH_SECRET` | 已真实支持 |
| Cookie field visibility | Current UI shows temporary Cookie field only when logged in | 已真实支持 |
| Temporary Cookie transport | Sent in POST JSON body as `temporaryCookie` | 已真实支持 |
| Backend Cookie persistence | `ytDlp.ts` writes Netscape content to a temporary file only when needed, then removes temp dir in `finally` | 已真实支持 |
| Frontend Cookie persistence | Current React state only; no localStorage/sessionStorage code found | 已真实支持 |
| Cookie logging | No explicit application logging of Cookie found; subprocess command args include Cookie header in memory | 部分支持 |
| Full Cookie masking in UI | Current UI does not echo Cookie after input, but textarea visibly contains what the user typed | 部分支持 |

V2 must keep Cookie client state ephemeral, not store it, not place it in URL params, and clear sensitive client state after a request completes or fails.

## Manifest And Resource Data

| Data | Current schema | Status |
| --- | --- | --- |
| Manifest | `sourceUrl`, `platform`, `title`, `author`, `durationSeconds`, `thumbnailUrl`, `expiresAt`, `variants`, `tracks`, `warnings`, `fallbacks` | 已真实支持 |
| Video track | Track `kind: "video"` with URL, container, codec, bitrate, width, height, FPS, size when returned by yt-dlp | 已真实支持 |
| Audio track | Track `kind: "audio"` with URL, container, codec, bitrate, size when returned by yt-dlp | 已真实支持 |
| Combined track | Track `kind: "combined"` | 已真实支持 |
| HLS/DASH stream | Track `kind: "hls"` or `"dash"` | 已真实支持 |
| Subtitle track | No `subtitle` kind in `TrackSchema` | 尚未实现 |
| Publish date | Not in `ManifestSchema` | 尚未实现 |
| File size | Included only when yt-dlp returns `filesize` or `filesize_approx` | 部分支持 |

V2 must not fabricate subtitles, publish dates, or sizes.

## Download And Merge

| Action | Current behavior | Status |
| --- | --- | --- |
| Direct download | Link opens selected combined source URL in browser | 已真实支持, 源站限制可能影响 |
| Browser merge | Uses ffmpeg.wasm to fetch video/audio tracks and save merged blob locally | 已真实支持, 受 CORS/format/browser memory 限制 |
| Local command | Generates `yt-dlp`, `aria2`, and `ffmpeg` command strings | 已真实支持 |
| Server-side download | Not implemented by design | 技术上不应支持 |
| Persistent server media storage | Not implemented by design | 技术上不应支持 |

## Current Error Structure

| Error | Source | Current structure |
| --- | --- | --- |
| Empty link | `normalizeInputUrl` throws | `{ ok:false, error:"请输入视频链接" }` |
| Invalid protocol/URL | `normalizeInputUrl` or URL constructor throws | `{ ok:false, error:string }` |
| Unsupported platform | `createResolveService` throws | `{ ok:false, error:"暂不支持该平台" }` |
| Policy block | `checkPolicy` throws | `{ ok:false, error:"该链接似乎涉及私密、付费或 DRM 受限内容，本站不提供解析。" }` |
| Cookie without login | `createResolveService` throws | `{ ok:false, error:"使用临时 Cookie 解析需要先登录" }` |
| Rate limit | `MemoryRateLimiter` throws | `{ ok:false, error:"请求过于频繁，请稍后再试" }` |
| yt-dlp login/auth | `formatYtDlpError` maps message | `{ ok:false, error:"该平台需要账号态..." }` |
| X/Twitter no video | `formatYtDlpError` maps message | `{ ok:false, error:"X/Twitter 没在这条帖子里找到可下载视频..." }` |
| Timeout | child process timer throws | `{ ok:false, error:"解析超时" }` |
| Browser merge CORS/format/missing track | `checkBrowserMerge` returns typed client reason | Client-only typed failure |

V2 should map these strings into frontend error categories, but not change the API contract in this round.

## Protected Or Unsupported Content

| Content type | Support | Rule |
| --- | --- | --- |
| DRM | 技术上不应支持 | Do not parse or claim bypass. |
| Paid/member-only content | 技术上不应支持 | Do not bypass payment or membership restrictions. |
| Private content | 技术上不应支持 unless user has legitimate Cookie and source allows access | UI must not encourage bypass. |
| Region restricted content | 部分受源站/yt-dlp/proxy限制 | UI should explain limitation and avoid false promises. |

