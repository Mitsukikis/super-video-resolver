# X / Twitter E2E Validation Report

Generated: 2026-07-05 08:49:08 +08:00

Branch: `fix/twitter-public-video-resolver`

## Runtime

- Local server: `http://127.0.0.1:4000`
- Node: `v24.14.0`
- npm: `11.9.0`
- yt-dlp: `2026.06.09`
- ffmpeg: `8.1-full_build-www.gyan.dev`
- `/api/runtime`: `resolverReady=true`, `ytDlpAvailable=true`, `ffmpegAvailable=true`, `tempDirectoryWritable=true`

No platform Cookie was provided for the public-video tests.

## Public Video Samples

Media CDN direct links are intentionally not recorded here. The table only records tweet sample IDs, returned counts, and media characteristics.

| Sample | URL form | Result | Direct MP4 variants | Heights | Bitrates | Cookie used |
| --- | --- | --- | ---: | --- | --- | --- |
| NASA `1285523063400992769` | `x.com/.../status/...?...` | Success | 3 | 270p, 360p, 720p | 288, 832, 2176 kbps | No |
| NASA `1519228308260540418` | `twitter.com/.../status/...` | Success | 3 | 270p, 360p, 720p | 288, 832, 2176 kbps | No |
| NASA `1028464148244582403` | `mobile.twitter.com/.../status/.../video/1?...` | Success | 3 | 180p, 360p, 720p | 288, 832, 2176 kbps | No |
| Reuters `1639732637446307840` | `x.com/.../status/...` | Success | 4 | 270p, 360p, 720p, 1080p | 288, 832, 2176, 10368 kbps | No |
| Reuters `961732631049093123` | `twitter.com/.../status/.../video/1?...` | Success | 3 | 180p, 360p, 720p | 320, 832, 2176 kbps | No |

Summary:

- Public no-Cookie parsing succeeded for 5 / 5 public native-video samples.
- Every successful sample returned real direct-save MP4 variants.
- No Cookie warning was returned.
- The adapter also returned additional HLS/audio stream entries when yt-dlp exposed them, but direct MP4 variants are now visible as primary download choices.

## Error Path Checks

| Sample | Result | User-facing behavior |
| --- | --- | --- |
| X status id `1` | Failed | Classified as no embedded video / no downloadable MP4 variants. |
| X profile page `https://x.com/NASA` | Failed before yt-dlp | Tells the user to paste a single public `/status/` tweet link, not a profile/search/list page. |

## Improvements Versus Old Logic

- Public X/Twitter videos no longer default to a Cookie-oriented explanation.
- Empty Cookie files are not sent in public mode.
- User-provided Cookie no longer blocks a successful public/no-Cookie attempt; the adapter tries public mode first.
- `mobile.twitter.com` links and common tracking parameters are normalized before resolving.
- X direct MP4 variants are exposed as `direct-save` manifest options.
- Non-status X URLs are rejected with a precise next action.

## Current Support Statement

X / Twitter is still a limited-support platform:

- Supported: public single-tweet links with X/Twitter native videos or GIF-style MP4 variants.
- Sometimes needs user Cookie: age/sensitive/login-gated content where the user has legitimate access.
- Not supported: protected accounts, private tweets, subscriptions, paid content, DRM, account-permission bypass, external video cards, deleted content, and region/account restrictions.

## Recommendation

This fix is a meaningful improvement and is suitable to merge back into `feat/universal-video-resolver-v2` after the full test, typecheck, lint, and production build pass.
