# Bilibili Public No-Cookie Adapter Audit

生成时间：2026-07-05  
分支：`fix/bilibili-public-no-cookie-resolver`  
范围：只审计并修复 Bilibili 公开视频无 Cookie 优先解析，不新增其它平台，不修改整体 UI。

## 结论

Bilibili 公开视频不应默认要求用户提供 Cookie。当前本地复现显示：

- 裸 `yt-dlp --dump-single-json https://www.bilibili.com/video/BV1GJ411x7h7` 会触发 `HTTP 412: Precondition Failed`。
- 仅添加 `User-Agent` 和 `Referer` 仍会触发 412。
- 同一公开 BV 链接添加 `User-Agent`、`Referer:https://www.bilibili.com/`、`Origin:https://www.bilibili.com` 后，无 Cookie 成功返回标题、UP 主、视频轨道和音频轨道。
- Bilibili 公开 `view` / `playurl` 接口对该公开视频也能无 Cookie 返回基础信息和普通清晰度资源。

因此当前问题的首要 root cause 是请求策略不完整，尤其缺少 `Origin`，不是“公开视频必须登录”。

## 当前链路审计

1. URL 识别
   - 原 V2 只识别 `bilibili.com` 及子域名。
   - 原 V2 不识别 `b23.tv`。
   - 原 V2 不区分跟踪参数和 Bilibili 有意义的 `p` 分 P 参数。

2. Resolver
   - 当前仍使用统一 yt-dlp resolver。
   - 未新增独立 Bilibili public API adapter，因为加上必要公开请求头后，yt-dlp 已能无 Cookie 返回统一格式所需数据。
   - 后续如果服务器环境仍频繁 412，可再新增专用 public API adapter 作为 fallback。

3. yt-dlp 参数
   - 原 V2 参数只有 `--dump-single-json --no-playlist --no-warnings`。
   - 原 V2 没有有限重试。
   - 原 V2 没有 Bilibili `Referer` / `Origin` / 桌面 UA。

4. Cookie 处理
   - `classifyTemporaryCookie()` 对空输入返回 `kind: none`，不会创建空 `cookies.txt`。
   - 用户提供 Cookie 时，站内仍要求已登录授权。
   - Netscape cookies.txt 会写入临时目录，并在 `finally` 清理。
   - 本轮没有硬编码 Cookie，也没有把 Cookie 持久化到 localStorage、URL、日志或文档。

5. 错误分类
   - 原 V2 没有 Bilibili 412 专门映射。
   - 原 V2 的 `not found` 依赖缺失判断过宽，可能把 Bilibili 404 / b23 失败误判成 yt-dlp 未安装。

## 本轮实现

- `b23.tv` 识别为 Bilibili。
- `bilibili.com` 和 `b23.tv` 写入能力声明。
- Bilibili 链接规范化：
  - 清理 `spm_id_from`、`vd_source` 等跟踪参数。
  - 保留 `p=2` 这类分 P 参数。
  - 清理 hash。
- Bilibili yt-dlp 请求增加：
  - `--retries 2`
  - `--fragment-retries 2`
  - `Referer:https://www.bilibili.com/`
  - `Origin:https://www.bilibili.com`
  - 桌面 Chromium User-Agent
- Bilibili 412 映射为“公开视频接口被源站策略拦截 / 可能是请求头、风控、IP 限制或请求过频”，不再默认要求 Cookie。
- b23 短链展开失败单独提示用户换完整 BV / av 链接。
- 无效 Cookie、高画质登录态、权限不足、视频不存在等错误继续单独分类。
- 前端错误分类新增 `source-blocked`，用于 Bilibili 412 / 源站策略拦截。

## 未做的事

- 未绕过会员、付费、DRM、私密、地区或账号权限。
- 未新增抖音、小红书、微博。
- 未使用代理池、刷 IP、风控绕过服务。
- 未把 Bilibili 标成完全稳定支持。
- 未新增独立 Bilibili public API adapter；当前最小修复是让现有 yt-dlp adapter 的公开请求策略正确。

## 风险

- Bilibili 源站策略可能随时变化，服务器 IP 也可能被临时风控。
- 无 Cookie 模式通常只能稳定拿到普通清晰度或部分公开资源。
- 高画质、登录态、会员、私密、地区限制内容不应承诺支持。
- Bilibili 返回的媒体直链通常需要正确 Referer/UA，且有过期时间；报告中不记录完整媒体直链。

