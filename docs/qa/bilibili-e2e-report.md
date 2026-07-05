# Bilibili Resolver E2E Report

生成时间：2026-07-04  
分支：`fix/bilibili-resolver-412`  
范围：仅验证 Bilibili 适配、错误分类、Cookie 授权边界和统一资源模型，不新增平台，不修改整体 UI。

## Local Runtime

| Item | Result |
| --- | --- |
| Node | `v24.14.0` |
| npm | `11.9.0` |
| yt-dlp | `2026.06.09` |
| ffmpeg | `8.1-full_build-www.gyan.dev` |
| `/api/runtime` | `resolverReady: true`, `ytDlpAvailable: true`, `ffmpegAvailable: true` |

## Real API Validation

| Scenario | Input | Result |
| --- | --- | --- |
| Public BV link, no Cookie | Public Bilibili BV sample | Failed with classified HTTP 412 source-policy message |
| Public BV link, real Cookie | Not verified | No user-provided Bilibili Cookie was available |
| Invalid BV link | Invalid Bilibili BV sample | Failed with “视频不存在或已删除 / 检查 BV、av、分 P 链接” |
| Invalid Cookie after site login | Public Bilibili BV sample plus fake Bilibili Cookie | Failed with classified HTTP 412 source-policy message; source did not return a distinct invalid-cookie error |
| Cookie submitted without site login | Public Bilibili BV sample plus fake Cookie | Rejected before resolver with “使用临时 Cookie 解析需要先登录” |
| Still-triggered 412 case | Public Bilibili BV sample, no Cookie | Reproduced and mapped to source-policy blocked |

No full Cookie values or media direct URLs are recorded in this report.

## Unit And Adapter Coverage

| Coverage | Result |
| --- | --- |
| Bilibili platform detection | `bilibili.com` and `b23.tv` detected as Bilibili |
| BV URL handling | Standard Bilibili video URLs route to the Bilibili adapter |
| b23.tv short-link handling | Detection is covered; real short-code expansion is delegated to yt-dlp and was not E2E-verified without a real short-code sample |
| HTTP 412 mapping | Backend maps to actionable Bilibili source-policy guidance |
| Cookie missing / authorization boundary | Frontend and API classify missing site authorization before accepting temporary Cookie |
| Cookie invalid prompt | UI classifier supports invalid/expired Cookie messages when the backend/source returns that signal |
| Unified resource model | Bilibili split and combined yt-dlp formats convert to the shared manifest/variant model |

## Current True Support Range

Bilibili remains **limited support**, not full support.

Supported:

- Detect `bilibili.com` and `b23.tv` as Bilibili inputs.
- Route Bilibili links through the existing yt-dlp resolver.
- Pass a temporary user-provided Bilibili Cookie only for the current request after site authorization.
- Clean up temporary `cookies.txt` files in `finally`.
- Add Bilibili-specific `Referer`, desktop `User-Agent`, finite `--retries`, and finite `--fragment-retries`.
- Convert returned Bilibili audio/video formats into the shared manifest model when yt-dlp returns usable formats.
- Classify common Bilibili failures: HTTP 412, login required, Cookie invalid, permission denied, missing/deleted video, parser outdated, timeout/source failure.

Not proven / not supported:

- No successful public Bilibili track extraction was observed in this local E2E run.
- No real user Cookie was provided, so authenticated Bilibili parsing is not accepted as verified.
- No direct Bilibili download was verified because no successful Bilibili manifest was produced.
- The project does not bypass membership, paid, DRM, private, region, or account-permission restrictions.

## HTTP 412 Handling

HTTP 412 is now treated as a Bilibili source-policy block, with guidance to:

- Confirm the link is a public Bilibili video.
- Try again later if the source is temporarily blocking requests.
- If the content is account-state dependent, site-authorize first and provide the user’s own temporary Bilibili Cookie.
- Avoid any claim that the site can bypass Bilibili account permissions, paid access, DRM, or private visibility.

## Remaining Failure Scenarios

- Public Bilibili samples may still return HTTP 412 even after adding UA/Referer and finite retry parameters.
- Fake or stale Cookie can still be surfaced as HTTP 412 if Bilibili does not return a distinct invalid-cookie error.
- b23.tv short links are detected, but real short-code expansion still depends on yt-dlp/source behavior.
- Successful Bilibili download and browser merge remain unverified until a link resolves to a real manifest.

## Recommendation

This branch improves correctness and user-facing diagnostics, but it should be merged back to `feat/universal-video-resolver-v2` only after the full test/type/lint/build checks pass. It should not be marketed as stable Bilibili support yet.
