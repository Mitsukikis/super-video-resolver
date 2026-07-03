import type { Platform } from "./manifest";
import { detectPlatform, normalizeInputUrl } from "./platform";

export type PlannedPlatform = "douyin" | "xiaohongshu" | "weibo";
export type UiPlatformId = Platform | PlannedPlatform;
export type PlatformSupportStatus = "supported" | "limited" | "planned";
export type PlatformDetectionStatus = "empty" | "invalid" | "supported" | "planned" | "unknown";

export type PlatformCapability = {
  id: UiPlatformId;
  label: string;
  shortLabel: string;
  domains: string[];
  status: PlatformSupportStatus;
  statusLabel: string;
  resolveEnabled: boolean;
  cookieRequirement: "optional" | "sometimes" | "often" | "unsupported";
  browserMerge: "mixed" | "unlikely" | "not-available";
  outputTypes: string[];
  notes: string;
};

export type PlatformDetection = {
  status: PlatformDetectionStatus;
  canResolve: boolean;
  platformId?: UiPlatformId;
  capability?: PlatformCapability;
  label: string;
  message: string;
};

export const platformCapabilities: Record<UiPlatformId, PlatformCapability> = {
  youtube: {
    id: "youtube",
    label: "YouTube",
    shortLabel: "YouTube",
    domains: ["youtube.com", "youtu.be"],
    status: "supported",
    statusLabel: "已支持",
    resolveEnabled: true,
    cookieRequirement: "sometimes",
    browserMerge: "mixed",
    outputTypes: ["已合并", "音视频分离", "HLS/DASH"],
    notes: "公开内容可直接解析；部分年龄、地区或账号态内容可能需要平台 Cookie。"
  },
  bilibili: {
    id: "bilibili",
    label: "Bilibili",
    shortLabel: "B站",
    domains: ["bilibili.com"],
    status: "supported",
    statusLabel: "已支持",
    resolveEnabled: true,
    cookieRequirement: "sometimes",
    browserMerge: "unlikely",
    outputTypes: ["已合并", "音视频分离", "HLS/DASH"],
    notes: "公开链接可解析；高画质或账号可见内容可能需要平台 Cookie。"
  },
  x: {
    id: "x",
    label: "X / Twitter",
    shortLabel: "X",
    domains: ["x.com", "twitter.com"],
    status: "limited",
    statusLabel: "有限支持",
    resolveEnabled: true,
    cookieRequirement: "often",
    browserMerge: "unlikely",
    outputTypes: ["已合并", "音视频分离"],
    notes: "帖子类型、敏感内容、私密内容和登录态会影响解析；并非每条帖子都含可下载视频。"
  },
  douyin: {
    id: "douyin",
    label: "抖音",
    shortLabel: "抖音",
    domains: ["douyin.com"],
    status: "planned",
    statusLabel: "待接入",
    resolveEnabled: false,
    cookieRequirement: "unsupported",
    browserMerge: "not-available",
    outputTypes: [],
    notes: "当前后端没有抖音解析器，不能解析。"
  },
  xiaohongshu: {
    id: "xiaohongshu",
    label: "小红书",
    shortLabel: "小红书",
    domains: ["xiaohongshu.com", "xhslink.com"],
    status: "planned",
    statusLabel: "待接入",
    resolveEnabled: false,
    cookieRequirement: "unsupported",
    browserMerge: "not-available",
    outputTypes: [],
    notes: "当前后端没有小红书解析器，不能解析。"
  },
  weibo: {
    id: "weibo",
    label: "微博",
    shortLabel: "微博",
    domains: ["weibo.com"],
    status: "planned",
    statusLabel: "待接入",
    resolveEnabled: false,
    cookieRequirement: "unsupported",
    browserMerge: "not-available",
    outputTypes: [],
    notes: "当前后端没有微博解析器，不能解析。"
  }
};

const livePlatformIds: Platform[] = ["youtube", "bilibili", "x"];
const plannedPlatformIds: PlannedPlatform[] = ["douyin", "xiaohongshu", "weibo"];

export function getLivePlatforms() {
  return livePlatformIds.map((id) => platformCapabilities[id]);
}

export function getPlannedPlatforms() {
  return plannedPlatformIds.map((id) => platformCapabilities[id]);
}

function detectPlannedPlatform(hostname: string): PlannedPlatform | null {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (host === "douyin.com" || host.endsWith(".douyin.com")) return "douyin";
  if (host === "xiaohongshu.com" || host.endsWith(".xiaohongshu.com") || host === "xhslink.com" || host.endsWith(".xhslink.com")) {
    return "xiaohongshu";
  }
  if (host === "weibo.com" || host.endsWith(".weibo.com")) return "weibo";
  return null;
}

export function detectInputPlatform(input: string): PlatformDetection {
  if (!input.trim()) {
    return {
      status: "empty",
      canResolve: false,
      label: "等待输入",
      message: "粘贴视频链接后会自动识别平台。"
    };
  }

  let url: URL;
  try {
    url = normalizeInputUrl(input);
  } catch {
    return {
      status: "invalid",
      canResolve: false,
      label: "链接格式错误",
      message: "请输入 HTTP 或 HTTPS 视频链接。"
    };
  }

  const platform = detectPlatform(url);
  if (platform) {
    const capability = platformCapabilities[platform];
    return {
      status: "supported",
      canResolve: true,
      platformId: platform,
      capability,
      label: capability.label,
      message: capability.notes
    };
  }

  const planned = detectPlannedPlatform(url.hostname);
  if (planned) {
    const capability = platformCapabilities[planned];
    return {
      status: "planned",
      canResolve: false,
      platformId: planned,
      capability,
      label: capability.label,
      message: capability.notes
    };
  }

  return {
    status: "unknown",
    canResolve: false,
    label: "无法识别",
    message: "当前只能解析 YouTube、Bilibili 和 X / Twitter 链接。"
  };
}

