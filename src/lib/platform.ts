import type { Platform } from "./manifest";

export function normalizeInputUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS links are supported");
  }

  return url;
}

export function detectPlatform(url: URL): Platform | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "youtube";
  if (host === "bilibili.com" || host.endsWith(".bilibili.com")) return "bilibili";
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".twitter.com")) return "x";
  return null;
}

