import { describe, expect, it } from "vitest";
import { MemoryRateLimiter } from "@/lib/rateLimit";

describe("MemoryRateLimiter", () => {
  it("blocks after the configured limit", () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.check("ip:1", 2, 60_000).allowed).toBe(true);
    expect(limiter.check("ip:1", 2, 60_000).allowed).toBe(true);
    expect(limiter.check("ip:1", 2, 60_000).allowed).toBe(false);
  });
});

