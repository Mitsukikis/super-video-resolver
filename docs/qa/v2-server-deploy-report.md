# V2 Server Deploy Report

生成时间：2026-07-04  
部署目标：`http://82.157.202.171`  
部署用途：固化 V2 基础版可运行基线，作为后续 Bilibili 修复前的稳定参考。

## Deployment Snapshot

| 项目 | 结果 |
| --- | --- |
| 本地分支 | `feat/universal-video-resolver-v2` |
| 服务器分支 | `feat/universal-video-resolver-v2` |
| 服务器提交 | `c900be7a47fce09f6b840ce48b467d0eca08c9cb` |
| 部署时间 | 2026-07-04 15:17 CST 左右 |
| 服务状态 | `active` |
| 旧版本备份目录 | `/home/ubuntu/apps/super-video-resolver.pre-v2-20260704151147` 已存在 |

## Runtime Versions

| 依赖 | 服务器版本 |
| --- | --- |
| Node.js | `v22.23.1` |
| npm | `10.9.8` |
| yt-dlp | `2026.06.09` |
| ffmpeg | `6.1.1-3ubuntu5` |

## Runtime Health

`/api/runtime` 返回：

```json
{
  "resolverReady": true,
  "ytDlpAvailable": true,
  "ytDlpVersion": "2026.06.09",
  "ffmpegAvailable": true,
  "tempDirectoryWritable": true,
  "nodeVersion": "v22.23.1",
  "platform": "linux",
  "browserMergeEnabled": true
}
```

结论：服务器解析依赖已就绪，临时目录可写，运行时健康接口未暴露可执行文件绝对路径。

## API Validation

| 用例 | 结果 |
| --- | --- |
| YouTube 公开视频 | 成功，返回 `11` 条轨道、`7` 个下载选项 |
| Bilibili 公开视频样本 | 失败，源站返回 `HTTP 412: Precondition Failed` |
| X / Twitter 样本 | 失败，提示当前帖子没有可下载视频或需要平台 Cookie |

YouTube 成功结果摘要：

```text
platform: youtube
tracks: audio:4, video:6, combined:1
variants: direct-save:1, browser-merge:6
warnings: 0
```

## Log Risk Scan

检查范围：`journalctl -u super-video-resolver --since '2026-07-04 15:17:00' -n 800`

| 检查项 | 命中数 |
| --- | ---: |
| Cookie / auth token / session data 泄露 | 0 |
| 服务器绝对路径或临时 cookies.txt 路径泄露 | 0 |
| yt-dlp 原始错误或 Python warning 未脱敏 | 0 |
| ffmpeg / SERVER_FFMPEG 异常 | 0 |
| 频繁 500 / unhandled / uncaught | 0 |

服务内存：

```text
MemoryCurrent: 183 MB 左右
MemoryPeak: 226 MB 左右
NRestarts: 0
```

结论：部署后短时间观察未发现敏感信息泄露、明显异常日志或重启循环。

## Current Launch Scope

当前可以小范围试用的能力：

- YouTube 公开视频解析。
- 显示真实轨道、清晰度和下载选项。
- 服务器只返回资源清单，不代理下载、不长期保存视频文件。
- 临时平台 Cookie 只用于单次解析请求。
- 抖音、小红书、微博仍标记为待接入，不会误导为可解析平台。

## Current Limitations

当前不能对用户承诺：

- Bilibili 完整稳定支持。当前公开样本仍会触发 `HTTP 412`。
- X / Twitter 稳定支持。帖子类型、登录状态、敏感内容、地区限制都会影响解析。
- 浏览器本地合并稳定可用。当前只是提供可尝试的本地合并选项，仍受源站 CORS、浏览器内存和格式限制。
- 解析会员、付费、DRM、私密或权限受限内容。
- 抖音、小红书、微博解析能力。

建议对外说明：

```text
当前稳定支持 YouTube 公开视频解析；Bilibili 和 X / Twitter 为有限支持。受平台策略、登录状态、地区限制和源站规则影响，部分链接可能无法解析。
```

## Rollback Plan

如果后续 Bilibili 修复或其它改动导致线上不可用，可回滚到当前 V2 基线或旧版本备份。

回滚到当前稳定 V2 提交：

```bash
cd /home/ubuntu/apps/super-video-resolver
git fetch origin feat/universal-video-resolver-v2
git checkout feat/universal-video-resolver-v2
git reset --hard c900be7a47fce09f6b840ce48b467d0eca08c9cb
npm ci
npm run build
sudo systemctl restart super-video-resolver
curl -s http://127.0.0.1/api/runtime
```

回滚到部署前备份目录：

```bash
sudo systemctl stop super-video-resolver
mv /home/ubuntu/apps/super-video-resolver /home/ubuntu/apps/super-video-resolver.failed-rollback
mv /home/ubuntu/apps/super-video-resolver.pre-v2-20260704151147 /home/ubuntu/apps/super-video-resolver
sudo systemctl start super-video-resolver
curl -s http://127.0.0.1/api/runtime
```

注意：回滚时必须保留 `.env.production`，不要把真实访问码、Cookie 或密钥写入仓库。

