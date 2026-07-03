# 超级视频解析

一个公开视频解析 MVP：把支持的平台链接解析为统一的媒体清单，展示可用清晰度、音视频轨道和本地工具命令。服务器只做元数据和直链解析，不代理、不保存、不代下载、不在服务器合并视频文件。

## 功能

- 支持 YouTube、Bilibili、X / Twitter 链接识别与解析。
- 展示可用清晰度、媒体轨道、封装格式和源站直链。
- 音视频分离时优先提供浏览器端合并，视频流量走用户本机。
- 提供 ffmpeg、yt-dlp、aria2 等本地工具命令作为兜底方案。
- 登录后支持单次临时 Cookie 解析，不持久化保存 Cookie。

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 安全规则

- 不做服务器端视频代理。
- 不持久化保存 Cookie。
- 临时 Cookie 只允许登录后用于单次解析请求。
- 阻止 DRM、私密内容、付费墙绕过等场景。

## 线上地址

公网测试地址：`http://82.157.202.171`。

## 部署

首次初始化服务器：

```bash
bash deploy/provision-ubuntu.sh
```

部署或更新：

```bash
bash deploy/deploy.sh
```

生产环境变量文件位于 `/home/ubuntu/apps/super-video-resolver/.env.production`，不会提交到仓库。

常用服务命令：

```bash
sudo systemctl restart super-video-resolver
journalctl -u super-video-resolver -f
```
