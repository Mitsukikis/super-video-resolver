import { describe, expect, it } from "vitest";
import { MemoryRateLimiter } from "@/lib/rateLimit";
import { createResolveService } from "@/lib/server/resolveService";

describe("resolveService", () => {
  it("rejects unsupported platforms", async () => {
    const service = createResolveService([], new MemoryRateLimiter());
    await expect(service.resolve({ url: "https://example.com/video", ip: "1.1.1.1" })).rejects.toThrow("Unsupported platform");
  });

  it("requires login for temporary cookies", async () => {
    const service = createResolveService([], new MemoryRateLimiter());
    await expect(
      service.resolve({
        url: "https://www.youtube.com/watch?v=abc",
        ip: "1.1.1.1",
        temporaryCookie: "SID=x"
      })
    ).rejects.toThrow("Login is required");
  });
});

