# Bilibili Adapter Audit

生成时间：2026-07-04  
分支：`fix/bilibili-resolver-412`  
范围：仅审计 Bilibili 解析链路，不新增平台，不修改整体 UI。

## Current Chain

1. 平台识别
   - `src/lib/platform.ts` 识别 `bilibili.com` 及其子域名为 `bilibili`。
   - 当前未识别 `b23.tv` 短链。
   - `normalizeInputUrl()` 只做协议补全和 HTTP/HTTPS 校验，没有做 BV / av / 分 P URL 重写。

2. API 调用
   - `POST /api/resolve` 接收 `{ url, temporaryCookie? }`。
   - `createResolveService()` 负责 URL 规范化、平台识别、策略校验、Cookie 站内授权校验、限流，然后调用 resolver plugin。

3. yt-dlp 参数
   - 当前基础参数：`--dump-single-json --no-playlist --no-warnings`。
   - `YT_DLP_PROXY` 只应用于 YouTube 和 X，不应用于 Bilibili。
   - 当前没有 Bilibili 平台级 `User-Agent` 或 `Referer`。
   - 当前没有有限重试参数。

4. Cookie 传递
   - Header Cookie：通过 `--add-header Cookie:<value>` 传给 yt-dlp。
   - Netscape cookies.txt：写入系统临时目录 `super-video-cookies-* / cookies.txt`，并在 `finally` 中递归删除临时目录。
   - 未发现 Cookie 写入 localStorage、URL 或持久化数据库的逻辑。

5. HTTP 412 捕获
   - yt-dlp stderr 当前进入 `formatYtDlpError()`。
   - `formatYtDlpError()` 会过滤 Python warning 和服务器路径，但没有 Bilibili 专门映射。
   - 当前线上表现：`ERROR: [BiliBili] ... HTTP Error 412: Precondition Failed` 原样返回给前端。

6. 前端错误展示
   - `classifyResolveError()` 没有 Bilibili 412 专门分类。
   - 412 会落入普通 `parser-failed`，下一步建议不够具体。

7. 统一资源模型
   - `convertYtDlpInfoToManifest()` 根据 yt-dlp `formats` 生成 `video`、`audio`、`combined`、`hls`、`dash` 轨道。
   - 该模型可以承载 Bilibili 返回的音视频分离轨道和合并轨道。
   - 字幕、发布时间目前不是 manifest schema 的真实能力，不能虚构。

## Root Cause

当前 Bilibili 公开样本失败不是因为前端平台识别失败，也不是 manifest 模型无法承载，而是源站对当前 yt-dlp 请求返回 `HTTP 412`。项目缺少两层处理：

- 请求策略层：没有为 Bilibili 设置基础 UA / Referer，也没有有限重试。
- 错误语义层：没有把 HTTP 412 映射成“源站请求策略拦截 / 可能需要 Cookie”的可操作提示。

## Constraints

- 不绕过会员、付费、DRM、私密内容或账号权限。
- 不硬编码 Cookie。
- 不保存 Cookie。
- 不把完整 Cookie 写入日志、报告、localStorage 或 URL。
- 不把 Bilibili 标成完全支持。
- 不伪造解析成功。

## Planned Fix Surface

- 扩展 Bilibili URL 识别：保留 `bilibili.com`，增加 `b23.tv` 为 Bilibili 短链入口。
- 为 Bilibili yt-dlp 请求增加合规基础请求头：`User-Agent` 和 `Referer`。
- 增加有限重试参数，避免无限重试。
- 专门映射 Bilibili HTTP 412、登录态、Cookie 失效、权限不足、视频不存在/删除等错误。
- 前端将 Bilibili 412 显示为可操作提示：换公开视频、提供自己的 Bilibili Cookie、稍后重试或联系管理员更新 yt-dlp。
- 更新能力矩阵：Bilibili 仍为有限支持，不承诺完全稳定。

