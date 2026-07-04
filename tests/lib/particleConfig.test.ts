import { describe, expect, it } from "vitest";
import { getParticleSettings } from "@/lib/client/particleConfig";

describe("getParticleSettings", () => {
  it("reduces particle count on mobile and when reduced motion is enabled", () => {
    expect(getParticleSettings({ width: 390, height: 844, devicePixelRatio: 3, reducedMotion: false })).toEqual({
      count: 0,
      linkDistance: 0,
      speed: 0,
      interactionRadius: 0
    });

    expect(getParticleSettings({ width: 1440, height: 900, devicePixelRatio: 2, reducedMotion: false }).count).toBe(58);
    expect(getParticleSettings({ width: 1440, height: 900, devicePixelRatio: 2, reducedMotion: true }).count).toBe(0);
  });
});
