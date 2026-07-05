# X / Twitter Adapter Audit

Generated: 2026-07-05 08:49:08 +08:00

Scope: this audit only covers the current X / Twitter adapter path. It does not add Douyin, Xiaohongshu, Weibo, or any protected-content bypass.

## Current Chain

- Platform detection accepts `x.com`, `twitter.com`, and `*.twitter.com`.
- Resolver backend uses the shared yt-dlp adapter and converts yt-dlp `formats` into the unified manifest model.
- Cookie input is optional. The service requires local site login before any user-provided platform Cookie can be sent.
- Cookie content is classified as either a `Cookie:` header or a temporary Netscape `cookies.txt` file.
- Temporary cookie files are created under the OS temp directory and removed in `finally`.
- The API returns a manifest only; video bytes are not proxied or saved by the server.

## Findings Before This Fix

### P1: X Public Requests Were Too Conservative

The existing X copy and error mapping implied that missing Cookie was a common reason for public-video failure. For public native X/Twitter videos, no-Cookie mode should be tried first.

### P1: No X-Specific Request Headers

The shared yt-dlp base args did not set an X/Twitter Referer or desktop User-Agent. This can make public requests less stable than specialist downloader sites that use a guest/public strategy.

### P1: Direct MP4 Variants Were Misclassified

yt-dlp can return X formats like `http-288`, `http-832`, and `http-2176` as `https + mp4` with width, height, bitrate, and approximate size, but without `vcodec` / `acodec`. The old converter treated those as stream-like tracks, so the UI did not expose direct MP4 save options even when the resources were available.

### P2: `mobile.twitter.com` Was Not Explicitly Declared

The detector matched `mobile.twitter.com` through the `*.twitter.com` rule, but the capability registry did not list it. This made the visible support description incomplete.

### P2: Tracking Parameters Were Sent Through

Links with `?s=20`, `?t=...`, and fragments were passed to yt-dlp. yt-dlp often handles them, but normalized tweet URLs are cleaner and easier to test.

### P2: Profile URLs Could Enter Resolver

`https://x.com/NASA` is an X URL but not a single tweet. It could reach yt-dlp and produce an empty manifest-like result. The adapter should require a single `/status/<id>` tweet URL.

## Implemented Strategy

- Added X URL normalization:
  - Converts `mobile.twitter.com` to `twitter.com`.
  - Strips query parameters and hash fragments.
  - Keeps the tweet ID path unchanged.
- Added single tweet validation:
  - Allows `/user/status/<id>` and `/i/web/status/<id>`.
  - Rejects profile, search, list, and other non-status pages before resolver execution.
- Added X public-request headers:
  - `Referer:https://x.com/`
  - Desktop Chromium User-Agent.
- Kept no-Cookie mode as the default.
- If a user provides Cookie for X, the adapter now tries no-Cookie mode first and only falls back to Cookie mode if public mode fails.
- Updated X capability copy from "often needs Cookie" to "sometimes needs Cookie".
- Added X-specific error categories for:
  - No native embedded video / no MP4 variants.
  - Protected/private account.
  - Login, sensitive, or age-limited content.
  - Deleted/unavailable/suspended content.
  - External video cards.
  - Region limits.
  - Source strategy blocks or rate limits.
  - Outdated extractor.
- Added X direct MP4 conversion:
  - For X only, `http-*` formats with `https/http`, `mp4`, width, and height are treated as combined direct-save tracks.

## Cookie Handling Review

- No empty `cookies.txt` is created when the user does not provide Cookie.
- User-provided Cookie is trimmed and only used for the current request.
- Header-form Cookies are passed through yt-dlp args only for that child process.
- Netscape cookie content is written to a temporary file with mode `0600`.
- Temporary cookie directory is removed in `finally`.
- Tests and reports do not include full Cookie content.

## Remaining Limits

- This adapter does not bypass private tweets, protected accounts, subscription content, paywalled content, region limits, DRM, sensitive-content gates, or account permissions.
- It supports X/Twitter native videos and GIF-like MP4 variants. External video cards are not treated as supported.
- Public parsing still depends on yt-dlp and X source behavior. Guest/public endpoint behavior can change.
- Direct MP4 downloads are only exposed when yt-dlp returns concrete MP4 variants.

## Test Coverage Added

- `x.com`, `twitter.com`, and `mobile.twitter.com` detection.
- X tracking parameter normalization.
- X `/status/` validation versus profile URLs.
- UI detection for non-status X links.
- Service rejection before resolver execution for profile links.
- X public-request headers without Cookie args.
- X no-video, login, protected, and source-blocked error mapping.
- X `https + mp4 + http-*` formats converting into direct-save manifest variants.
