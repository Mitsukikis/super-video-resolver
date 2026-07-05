import type { Platform } from "./manifest";

export function normalizeInputUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("请输入视频链接");
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Only HTTP/HTTPS links are supported");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("仅支持 HTTP/HTTPS 链接");
  }

  return url;
}

export function detectPlatform(url: URL): Platform | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "youtube";
  if (host === "bilibili.com" || host.endsWith(".bilibili.com") || host === "b23.tv" || host.endsWith(".b23.tv")) {
    return "bilibili";
  }
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".twitter.com")) return "x";
  return null;
}

export function normalizePlatformUrl(url: URL): URL {
  const platform = detectPlatform(url);
  if (platform !== "bilibili") return url;

  const normalized = new URL(url.toString());
  const page = normalized.searchParams.get("p");
  normalized.search = "";
  if (page && /^\d+$/.test(page) && Number(page) > 1) {
    normalized.searchParams.set("p", page);
  }
  normalized.hash = "";
  return normalized;
}
