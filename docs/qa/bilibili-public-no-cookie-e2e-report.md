# Bilibili Public No-Cookie E2E Report

生成时间：2026-07-05  
分支：`fix/bilibili-public-no-cookie-resolver`

## Runtime

- Local server: `http://127.0.0.1:4000`
- Node: `v24.14.0`
- npm: `11.9.0`
- yt-dlp: `2026.06.09`
- ffmpeg: `8.1-full_build-www.gyan.dev`
- `/api/runtime`: `resolverReady=true`, `ytDlpAvailable=true`, `ffmpegAvailable=true`, `tempDirectoryWritable=true`

本轮公开样本均未提供 Bilibili Cookie。报告不记录完整 Cookie，也不记录完整媒体直链。

## Public Samples

| Sample | URL form | Result | Tracks | Variants | Video tracks | Audio tracks | Highest shown | Cookie |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| BV public | `bilibili.com/video/BV1GJ411x7h7` | Success | 9 | 6 | 6 | 3 | 480p | No |
| av public | `bilibili.com/video/av80433022` | Success | 9 | 6 | 6 | 3 | 480p | No |
| b23 redirect-style | `b23.tv/BV1GJ411x7h7` | Success | 9 | 6 | 6 | 3 | 480p | No |
| BV with tracking params | `bilibili.com/video/BV1GJ411x7h7/?spm...&p=1#...` | Success | 9 | 6 | 6 | 3 | 480p | No |
| Multi-part P2 | `bilibili.com/video/BV1LpD3YsETa?p=2` | Success | 5 | 2 | 2 | 3 | 480p | No |
| Invalid BV | `bilibili.com/video/BV0000000000` | Failed | 0 | 0 | 0 | 0 | N/A | No |

## High Quality Probe

公开 API 探针请求 `qn=112`：

- API returned code: `0`
- Requested quality: `112`
- Returned quality: `64`
- Support formats advertised: `1080P 高码率`, `1080P`, `720P`, `480P`, `360P`
- Actual DASH video tracks returned by no-Cookie probe: max `480p`
- Audio present: yes

解释：公开视频无 Cookie 可以解析普通清晰度资源；更高清晰度可能需要账号态、Cookie 或受源站策略限制。页面不应承诺 Bilibili 高画质无 Cookie 稳定可用。

## Error Path Checks

- 错误 BV：返回“Bilibili 视频不存在或已删除。请检查 BV / av / 分 P 链接是否完整。”
- b23 短链展开失败：单独映射为“b23.tv 短链展开失败”，建议换完整 BV / av 链接。
- HTTP 412：单独映射为“公开视频接口被源站策略拦截”，建议稍后重试、换公开视频、降低高画质预期；只有确认是登录态内容时才临时提供自己的 Bilibili Cookie。
- 无效 Cookie：单独映射为 Cookie 失效，不写入日志或报告。

## Download Capability

本轮公开样本返回的是分离音视频轨道：

- 视频轨道：存在。
- 音频轨道：存在。
- 已合并 direct-save variant：未返回。
- 浏览器本地合并 variant：存在。

因此当前 Bilibili 无 Cookie 链路可以返回真实轨道，但不应宣传为“直接下载已合并 MP4 稳定可用”。更准确的说明是：

> Bilibili 公开视频无 Cookie 可解析普通清晰度分离音视频轨道；可尝试浏览器本地合并，受源站跨域、浏览器内存和格式限制影响。

## Current Support Statement

- 已验证：普通公开 BV、普通公开 av、b23.tv BV 重定向形式、带跟踪参数链接、分 P `p=2` 链接。
- 有限支持：无 Cookie 普通清晰度公开视频轨道解析。
- 可能需要 Cookie：高画质、登录态、年龄/地区限制、账号可见内容。
- 不支持：会员、付费、DRM、私密内容、权限绕过、代理池/刷 IP 风控绕过。

## Recommendation

建议合并回 `feat/universal-video-resolver-v2` 后部署到服务器验证。服务器验证时重点看：

1. 服务器 IP 是否仍被 Bilibili 412。
2. `Origin:https://www.bilibili.com` 是否在服务器 yt-dlp 调用中生效。
3. 无 Cookie 是否能解析至少一个公开 BV 样本。
4. Bilibili 仍应展示为“有限支持”，不要承诺高画质或已合并 MP4。

