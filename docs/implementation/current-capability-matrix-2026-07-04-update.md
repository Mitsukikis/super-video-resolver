# Current Capability Matrix Update - 2026-07-04

This update records the acceptance results after the V2 runtime dependency and visual QA fixes.

## Runtime Dependencies

| Capability | Current status |
| --- | --- |
| yt-dlp lookup | `YTDLP_PATH` -> legacy `YT_DLP_BIN` -> system `PATH` |
| yt-dlp Windows support | Supports `yt-dlp.exe` |
| yt-dlp Linux/macOS support | Supports `yt-dlp` from `PATH` |
| Missing yt-dlp behavior | Returns `RESOLVER_DEPENDENCY_MISSING` before spawning parser |
| ffmpeg lookup | `FFMPEG_PATH` -> system `PATH` |
| Server ffmpeg vs browser wasm | Treated as separate capabilities; wasm does not replace server ffmpeg |
| Public runtime endpoint | `/api/runtime`, safe fields only, no executable paths |

## Platform Results

| Platform | Adapter status | 2026-07-04 real E2E result |
| --- | --- | --- |
| YouTube | Implemented through yt-dlp | Public test video resolved successfully with 11 tracks and 7 variants |
| Bilibili | Implemented through yt-dlp | Current public sample failed with source HTTP 412 |
| X / Twitter | Implemented through yt-dlp | Current public sample had no downloadable video |
| Douyin | Not implemented | Must not be displayed as parseable |
| Xiaohongshu | Not implemented | Must not be displayed as parseable |
| Weibo | Not implemented | Must not be displayed as parseable |

## Download And Merge Results

| Capability | Current status |
| --- | --- |
| YouTube direct combined track | Command-line Range request returned HTTP 206 |
| YouTube split video track | Command-line Range request returned HTTP 206 |
| YouTube split audio track | Command-line Range request returned HTTP 206 |
| Browser CORS precheck | Failed for the tested YouTube split tracks |
| Browser ffmpeg.wasm full merge | Not verified as successful; must not be claimed as generally available |
| Local tool fallback | ffmpeg / yt-dlp commands can be generated |

## Verification Tooling

| Tooling | Current status |
| --- | --- |
| lint script | Added as `npm run lint` |
| type check | `npm run typecheck` |
| unit tests | `npm test` |
| production build | `npm run build` |
| visual screenshots | `npm run visual:shots` using Playwright |

