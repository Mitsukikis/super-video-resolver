import { describe, expect, it } from "vitest";
import { getParticleSettings } from "@/lib/client/particleConfig";

describe("getParticleSettings", () => {
  it("reduces particle count on mobile and when reduced motion is enabled", () => {
    expect(getParticleSettings({ width: 390, height: 844, devicePixelRatio: 3, reducedMotion: false })).toEqual({
      count: 42,
      linkDistance: 104,
      speed: 0.28,
      interactionRadius: 120
    });

    expect(getParticleSettings({ width: 1440, height: 900, devicePixelRatio: 2, reducedMotion: false }).count).toBe(110);
    expect(getParticleSettings({ width: 1440, height: 900, devicePixelRatio: 2, reducedMotion: true }).count).toBe(34);
  });
});
