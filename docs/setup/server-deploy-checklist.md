# Server Deploy Checklist

生成时间：2026-07-04  
目标分支：`feat/universal-video-resolver-v2`  
目标：确认服务器具备运行 YouTube / Bilibili / X 解析基础环境。本清单不新增平台、不修改 UI。

## 当前项目部署方式

| 项目 | 当前结论 |
| --- | --- |
| Framework | Next.js App Router |
| Build command | `npm run build` |
| Start command | `npm run start -- -p <port> -H 0.0.0.0` |
| Package install | 服务器建议 `npm ci` |
| PM2 | 仓库未提供 PM2 配置，可选手动使用 |
| systemd | 仓库已提供 `deploy/super-video-resolver.service` |
| Docker | 仓库当前没有 Dockerfile / compose |
| Next.js standalone | 当前 `next.config.ts` 未启用 `output: "standalone"` |
| Existing deploy scripts | `deploy/provision-ubuntu.sh`、`deploy/deploy.sh` |

`deploy/deploy.sh` 支持 `DEPLOY_REF`。默认部署 `main`；测试 V2 分支时必须指定：

```bash
DEPLOY_REF=feat/universal-video-resolver-v2 bash deploy/deploy.sh
```

## Required Software

| Software | Requirement | Verify |
| --- | --- | --- |
| Node.js | 建议 Node.js 22，与 `deploy/provision-ubuntu.sh` 一致 | `node -v` |
| npm | 随 Node.js 安装 | `npm -v` |
| git | 拉取仓库 | `git --version` |
| yt-dlp | 必需，真实解析依赖 | `yt-dlp --version` 或 `$YTDLP_PATH --version` |
| ffmpeg | 建议安装，服务端/本地命令回退依赖 | `ffmpeg -version` |
| curl | 健康检查和 API 验证 | `curl --version` |

## Environment Variables

生产环境建议写入：

```bash
/home/ubuntu/apps/super-video-resolver/.env.production
```

必须配置：

```env
APP_BASE_URL=https://your-domain.example
ACCESS_CODE=change-to-a-strong-private-code
AUTH_SECRET=change-to-a-long-random-secret
YTDLP_PATH=/home/ubuntu/.local/bin/yt-dlp
FFMPEG_PATH=/usr/bin/ffmpeg
RESOLVE_TIMEOUT_MS=60000
NEXT_PUBLIC_APP_NAME=超级视频解析
NEXT_TELEMETRY_DISABLED=1
```

可选配置：

```env
YT_DLP_PROXY=
PORT=80
```

注意：

- 不要把真实 Cookie 写进 `.env.production`。
- 不要把真实访问码提交到 Git。
- `ACCESS_CODE` 是本站访问授权码，不是 YouTube / Bilibili / X 的平台 Cookie。
- `YTDLP_PATH` 和 `FFMPEG_PATH` 应该指向服务器上的可执行文件，不要写本地开发机路径。

## Windows Local Development

```powershell
npm install
Copy-Item .env.example .env.local
npm run build
npm run start -- --port 3000
```

Windows 依赖验证：

```powershell
yt-dlp --version
ffmpeg -version
Invoke-RestMethod http://127.0.0.1:3000/api/runtime
```

如果 `yt-dlp` 不在 PATH，使用 `.env.local`：

```env
YTDLP_PATH=C:\Tools\yt-dlp\yt-dlp.exe
FFMPEG_PATH=C:\Tools\ffmpeg\bin\ffmpeg.exe
```

## Linux Server With Existing Scripts

首次初始化服务器：

```bash
bash deploy/provision-ubuntu.sh
```

创建生产环境变量：

```bash
cd /home/ubuntu/apps/super-video-resolver
nano .env.production
chmod 600 .env.production
```

部署当前 V2 分支：

```bash
DEPLOY_REF=feat/universal-video-resolver-v2 bash deploy/deploy.sh
```

查看服务：

```bash
sudo systemctl status super-video-resolver --no-pager
journalctl -u super-video-resolver -f
```

## Manual Linux Deploy

```bash
git clone https://github.com/Mitsukikis/super-video-resolver.git /home/ubuntu/apps/super-video-resolver
cd /home/ubuntu/apps/super-video-resolver
git fetch origin feat/universal-video-resolver-v2
git checkout feat/universal-video-resolver-v2
npm ci
npm run build
npm run start -- -p 3000 -H 0.0.0.0
```

## PM2 Optional Deploy

仓库当前没有 PM2 配置。如果服务器习惯 PM2，可手动执行：

```bash
cd /home/ubuntu/apps/super-video-resolver
npm ci
npm run build
pm2 start npm --name super-video-resolver -- run start -- -p 3000 -H 0.0.0.0
pm2 save
```

PM2 也必须加载同一份生产环境变量。不要只在交互式 shell 里 export，因为 PM2 重启后可能丢失。

## systemd Deploy

仓库提供：

```text
deploy/super-video-resolver.service
```

当前服务使用：

```text
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/super-video-resolver
EnvironmentFile=-/home/ubuntu/apps/super-video-resolver/.env.production
ExecStart=/usr/bin/npm run start -- -p 80 -H 0.0.0.0
```

检查点：

- `ubuntu` 用户能执行 `YTDLP_PATH`。
- `ubuntu` 用户能执行 `FFMPEG_PATH`。
- `ubuntu` 用户能写系统临时目录。
- `.env.production` 权限建议为 `600`。
- 如果监听 80 端口，保留 `AmbientCapabilities=CAP_NET_BIND_SERVICE`。

## Docker

当前仓库没有 Dockerfile 或 compose 文件，因此本轮不提供 Docker 部署命令。后续如需 Docker，需要在镜像中安装 Node.js、yt-dlp、ffmpeg，并通过环境变量传入 `ACCESS_CODE`、`AUTH_SECRET`、`YTDLP_PATH`、`FFMPEG_PATH`。

## Reverse Proxy Notes

如果使用 Nginx / Caddy / Cloudflare：

- 反向代理到 Next.js 监听端口，例如 `127.0.0.1:3000` 或 `127.0.0.1:80`。
- 保留真实 `Host`、`X-Forwarded-For`、`X-Forwarded-Proto`。
- 不要缓存 `/api/resolve`、`/api/login`、`/api/logout`、`/api/runtime`。
- 上传体大小无需很大，本项目不接收视频文件上传。
- HTTPS 终止后，`APP_BASE_URL` 应该使用公网 HTTPS 地址。

## Runtime Verification

部署后第一条验证命令：

```bash
curl -s http://127.0.0.1/api/runtime
```

期望：

```json
{
  "resolverReady": true,
  "ytDlpAvailable": true,
  "ffmpegAvailable": true,
  "tempDirectoryWritable": true
}
```

如果 `resolverReady` 为 `false`：

1. 检查 `.env.production` 里的 `YTDLP_PATH`。
2. 用服务用户执行 `$YTDLP_PATH --version`。
3. 检查 systemd 是否加载了 `EnvironmentFile`。
4. 运行 `journalctl -u super-video-resolver -n 100 --no-pager`。

## YouTube Public Link Verification

使用合法公开视频验证。不要把媒体直链写进日志或报告。

```bash
curl -s -X POST http://127.0.0.1/api/resolve \
  -H "content-type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=<public-video-id>"}'
```

期望：

- `ok: true`
- `manifest.platform: "youtube"`
- `tracks` 数量大于 0
- `variants` 数量大于 0

## Bilibili Cookie Scenario Verification

Bilibili 当前仍可能触发 HTTP 412 或需要账号态。测试时只记录结果分类，不记录完整 Cookie。

流程：

1. 先用本站访问码登录，拿到 HTTP-only session。
2. 用户自愿提供自己的 Bilibili Cookie，仅用于本次请求。
3. 调用 `/api/resolve`。
4. 报告只写：样本类型、是否带 Cookie、是否返回轨道、错误分类。

示例请求中的 Cookie 必须替换为占位符：

```bash
curl -s -X POST http://127.0.0.1/api/resolve \
  -H "content-type: application/json" \
  -H "cookie: svr_session=<site-session-cookie>" \
  -d '{"url":"https://www.bilibili.com/video/<public-bv-id>/","temporaryCookie":"<bilibili-cookie-redacted>"}'
```

## X / Twitter Limited Support

X / Twitter 当前属于有限支持：

- 有些帖子没有视频。
- 有些帖子是引用帖、敏感内容、登录可见或地区限制。
- 需要账号态时，应提示用户提供自己的临时平台 Cookie。
- 不要宣称可以解析私密、付费或权限受限内容。

## Temp Directory And Cookie Cleanup

检查点：

- `yt-dlp` cookies.txt 临时文件只应写入系统临时目录。
- 请求结束后由 `finally` 清理临时目录。
- 应用日志不得打印完整 Cookie。
- 生产报告不得写完整媒体直链。

可以用系统临时目录权限粗测：

```bash
sudo -u ubuntu bash -lc 'tmp=$(mktemp -d) && echo ok > "$tmp/probe.txt" && rm -rf "$tmp" && echo temp-ok'
```

## Log Redaction Requirements

日志中不得出现：

- 完整平台 Cookie。
- 完整媒体直链。
- `ACCESS_CODE`。
- `AUTH_SECRET`。
- 临时 cookies.txt 文件内容。

允许记录：

- 平台名称。
- 错误分类。
- HTTP 状态码。
- 是否返回轨道。
- 安全版本号，例如 `yt-dlpVersion`。

## Pre-Push Check

推分支前建议：

```bash
git log --oneline --decorate -8
git status
```

推送当前分支：

```bash
git push -u origin feat/universal-video-resolver-v2
```

不要直接合并 `main`。先完成服务器运行验证和 Bilibili 适配修复。

