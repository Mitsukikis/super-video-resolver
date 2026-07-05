export type ResolveErrorKind =
  | "empty-url"
  | "invalid-url"
  | "unsupported-platform"
  | "cookie-missing"
  | "cookie-invalid"
  | "login-required"
  | "protected-content"
  | "rate-limited"
  | "source-blocked"
  | "timeout"
  | "no-downloadable-resource"
  | "network"
  | "server-config"
  | "parser-failed"
  | "unknown";

export type ClassifiedResolveError = {
  kind: ResolveErrorKind;
  title: string;
  message: string;
  nextAction: string;
  retry: boolean;
};

export function classifyResolveError(message: string): ClassifiedResolveError {
  const text = message.trim();

  if (/请输入视频链接/.test(text)) {
    return {
      kind: "empty-url",
      title: "链接为空",
      message: "还没有输入视频链接。",
      nextAction: "粘贴一个公开视频链接后再解析。",
      retry: false
    };
  }

  if (/Invalid URL|仅支持 HTTP|链接格式|Failed to parse URL/i.test(text)) {
    return {
      kind: "invalid-url",
      title: "链接格式错误",
      message: "这个链接无法作为 HTTP/HTTPS 视频地址解析。",
      nextAction: "检查链接是否复制完整，并确认以 http:// 或 https:// 开头。",
      retry: false
    };
  }

  if (/暂不支持该平台/.test(text)) {
    return {
      kind: "unsupported-platform",
      title: "平台暂不支持",
      message: "当前后端没有这个平台的解析器。",
      nextAction: "请换用 YouTube、Bilibili 或 X / Twitter 链接。",
      retry: false
    };
  }

  if (/RESOLVER_DEPENDENCY_MISSING|服务器尚未安装视频解析组件|SERVER_FFMPEG_MISSING/i.test(text)) {
    return {
      kind: "server-config",
      title: "服务器解析组件未就绪",
      message: "服务器尚未安装视频解析组件，请联系管理员完成配置。",
      nextAction: "管理员需要安装 yt-dlp，并确认服务进程可以通过 YTDLP_PATH 或 PATH 找到它。",
      retry: false
    };
  }

  if (/使用临时 Cookie 解析需要先登录/.test(text)) {
    return {
      kind: "cookie-missing",
      title: "需要站内授权",
      message: "临时 Cookie 输入需要先使用本站访问码解锁。",
      nextAction: "先完成站内授权，再粘贴对应视频平台 Cookie 后重试。",
      retry: true
    };
  }

  if (/Bilibili .*HTTP 412|Bilibili .*源站策略|Bilibili .*请求过频|Bilibili .*IP 限制/i.test(text)) {
    return {
      kind: "source-blocked",
      title: "Bilibili 源站策略拦截",
      message: "Bilibili 当前公开视频请求被源站策略、IP 限制或临时风控拦截。",
      nextAction: "稍后重试、换一个公开视频，或降低高画质预期；只有确认是自己账号可访问的登录态内容时，再临时提供 Bilibili Cookie。",
      retry: true
    };
  }

  if (/Cookie|cookies?|authentication|unauthori[sz]ed|登录|账号态|sign in/i.test(text)) {
    return {
      kind: "login-required",
      title: "需要平台账号态",
      message: text || "该内容需要视频平台账号态。",
      nextAction: "粘贴对应平台 Cookie 后重试；Cookie 只用于本次请求。",
      retry: true
    };
  }

  if (/私密|付费|DRM|premium|private|paid|members-only/i.test(text)) {
    return {
      kind: "protected-content",
      title: "受保护内容",
      message: "该链接似乎涉及私密、付费或 DRM 受限内容。",
      nextAction: "本站不提供权限绕过；请改用公开视频链接。",
      retry: false
    };
  }

  if (/请求过于频繁|rate/i.test(text)) {
    return {
      kind: "rate-limited",
      title: "请求过于频繁",
      message: "当前请求次数达到临时限制。",
      nextAction: "稍后再试，或减少重复解析请求。",
      retry: true
    };
  }

  if (/超时|timeout/i.test(text)) {
    return {
      kind: "timeout",
      title: "解析超时",
      message: "解析器等待源站响应太久。",
      nextAction: "可以重试，或复制本地 yt-dlp 命令在自己的设备上执行。",
      retry: true
    };
  }

  if (/No video could be found|没在这条帖子里找到可下载视频|没有可下载资源/i.test(text)) {
    return {
      kind: "no-downloadable-resource",
      title: "没有可下载资源",
      message: text || "解析器没有找到可下载的视频资源。",
      nextAction: "确认链接不是图片/文字帖、引用帖、私密内容或已删除内容。",
      retry: true
    };
  }

  if (/network|fetch failed|ECONN|ENOTFOUND/i.test(text)) {
    return {
      kind: "network",
      title: "网络请求失败",
      message: "解析器或源站网络请求失败。",
      nextAction: "检查网络后重试，或使用本地工具命令。",
      retry: true
    };
  }

  return {
    kind: "parser-failed",
    title: "解析失败",
    message: text || "解析器没有返回可用结果。",
    nextAction: "检查链接、Cookie 或稍后重试。",
    retry: true
  };
}

export function redactCookieForDisplay(cookie: string) {
  const text = cookie.trim();
  if (!text) return "";
  if (text.startsWith("# Netscape HTTP Cookie File") || text.includes("\t")) {
    const lines = text.split(/\r?\n/).filter(Boolean).length;
    return `[cookies.txt] ${lines} 行 Cookie 内容已隐藏`;
  }
  return text
    .split(";")
    .map((part) => {
      const [name] = part.trim().split("=");
      return name ? `${name}=***` : "";
    })
    .filter(Boolean)
    .join("; ");
}
