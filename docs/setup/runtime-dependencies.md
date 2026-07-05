# Resolver Runtime Dependencies

本文档说明超级视频解析网站在开发、部署和验收时需要的运行依赖。服务器只负责解析并返回媒体清单；浏览器或用户本机负责下载与可行的本地合并。

## Dependency Roles

| Dependency | Runs where | Used for | Notes |
| --- | --- | --- | --- |
| `yt-dlp` | Server | Fetch metadata and media resource URLs for YouTube, Bilibili, and X / Twitter | Required for real parsing. |
| native `ffmpeg` | Server or local operator machine | Some `yt-dlp` workflows and copied local merge commands can require it | Browser `ffmpeg.wasm` does not replace native server ffmpeg. |
| `@ffmpeg/ffmpeg` | Browser | Optional client-side merge when split tracks and CORS allow it | Can fail because of CORS, memory, codec, or browser support. |

## Lookup Strategy

The server resolves `yt-dlp` in this order:

1. `YTDLP_PATH`
2. legacy `YT_DLP_BIN`
3. system `PATH`, including `yt-dlp.exe` on Windows

The server resolves native `ffmpeg` in this order:

1. `FFMPEG_PATH`
2. system `PATH`, including `ffmpeg.exe` on Windows

Do not commit large binary executables to Git. Do not hardcode a developer machine path in source code. Configure paths through environment variables or the service manager.

## Windows Local Development

Install `yt-dlp`:

```powershell
winget install yt-dlp.yt-dlp
```

Install `ffmpeg`:

```powershell
winget install Gyan.FFmpeg
```

Verify from PowerShell:

```powershell
yt-dlp --version
ffmpeg -version
```

If the commands are not on `PATH`, set explicit paths in `.env.local`:

```env
YTDLP_PATH=C:\Tools\yt-dlp\yt-dlp.exe
FFMPEG_PATH=C:\Tools\ffmpeg\bin\ffmpeg.exe
```

Restart the Next.js process after changing environment variables.

## Linux Server

Example install commands:

```bash
python3 -m pip install --user -U yt-dlp
sudo apt-get update
sudo apt-get install -y ffmpeg
```

Verify:

```bash
yt-dlp --version
ffmpeg -version
```

If using systemd, PM2, Docker, or another process manager, make sure its environment includes the same `PATH` as your shell, or set:

```env
YTDLP_PATH=/usr/local/bin/yt-dlp
FFMPEG_PATH=/usr/bin/ffmpeg
```

The service user must be able to execute those binaries and write to the OS temp directory.

## Docker

This project currently does not include a Dockerfile. If you containerize it later:

- Install `yt-dlp` and `ffmpeg` in the image.
- Pin package versions or image tags where practical.
- Do not download executables on every API request.
- Pass `YTDLP_PATH` and `FFMPEG_PATH` through container environment variables when needed.

## Runtime Health Check

The project exposes a safe health endpoint:

```bash
curl http://localhost:3000/api/runtime
```

It returns safe booleans and versions, for example:

```json
{
  "resolverReady": true,
  "ytDlpAvailable": true,
  "ffmpegAvailable": true,
  "browserMergeEnabled": true
}
```

It must not expose cookies, access codes, absolute server directories, command arguments, temp file names, or user request content.

## Verification Commands

Run these before treating the resolver as deployable:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Then run real endpoint checks with legal public test content:

```bash
curl -X POST http://localhost:3000/api/resolve \
  -H "content-type: application/json" \
  -d "{\"url\":\"https://www.youtube.com/watch?v=<public-test-id>\"}"
```

Do not use DRM, paid, private, region-bypass, or unauthorized content for testing.
