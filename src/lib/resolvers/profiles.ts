import type { Platform } from "@/lib/manifest";

export const resolverProfiles: Record<Platform, { displayName: string; domains: string[] }> = {
  youtube: { displayName: "YouTube", domains: ["youtube.com", "youtu.be"] },
  bilibili: { displayName: "Bilibili", domains: ["bilibili.com"] },
  x: { displayName: "X / Twitter", domains: ["x.com", "twitter.com"] }
};

