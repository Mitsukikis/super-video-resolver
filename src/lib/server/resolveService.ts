import { randomUUID } from "node:crypto";
import type { Manifest } from "@/lib/manifest";
import { detectPlatform, normalizeInputUrl, normalizePlatformUrl } from "@/lib/platform";
import { checkPolicy } from "@/lib/policy";
import { MemoryRateLimiter, resolveRateLimiter } from "@/lib/rateLimit";
import type { ResolverPlugin } from "@/lib/resolvers/types";

export type ResolveRequest = {
  url: string;
  ip: string;
  isLoggedIn?: boolean;
  temporaryCookie?: string;
};

export function createResolveService(plugins: ResolverPlugin[], limiter: MemoryRateLimiter = resolveRateLimiter) {
  return {
    async resolve(request: ResolveRequest): Promise<Manifest> {
      const url = normalizePlatformUrl(normalizeInputUrl(request.url));
      const platform = detectPlatform(url);
      if (!platform) throw new Error("暂不支持该平台");

      const policy = checkPolicy(url);
      if (!policy.allowed) throw new Error(policy.reason);

      const cookie = request.temporaryCookie?.trim();
      if (cookie && !request.isLoggedIn) {
        throw new Error("使用临时 Cookie 解析需要先登录");
      }

      const limit = cookie ? 20 : request.isLoggedIn ? 100 : 20;
      const identity = `${request.ip}:${platform}:${request.isLoggedIn ? "user" : "guest"}:${cookie ? "cookie" : "public"}`;
      const rate = limiter.check(identity, limit, 60 * 60 * 1000);
      if (!rate.allowed) throw new Error("请求过于频繁，请稍后再试");

      const plugin = plugins.find((candidate) => candidate.id === platform && candidate.match(url));
      if (!plugin) throw new Error("该平台解析器暂不可用");

      return plugin.resolve({
        url,
        platform,
        temporaryCookie: cookie,
        requestId: randomUUID()
      });
    }
  };
}
