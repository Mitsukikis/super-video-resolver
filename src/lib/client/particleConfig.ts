export type ParticleSettingsInput = {
  width: number;
  height: number;
  devicePixelRatio: number;
  reducedMotion: boolean;
};

export type ParticleSettings = {
  count: number;
  linkDistance: number;
  speed: number;
  interactionRadius: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getParticleSettings(input: ParticleSettingsInput): ParticleSettings {
  const width = Math.max(0, input.width);
  const area = width * Math.max(0, input.height);
  const densityCount = Math.round(area / 11800);
  const desktopCount = clamp(densityCount, 64, 110);
  const mobileCount = width < 720 ? 42 : desktopCount;
  const reducedCount = input.reducedMotion ? Math.min(34, mobileCount) : mobileCount;

  return {
    count: reducedCount,
    linkDistance: width < 720 ? 104 : 136,
    speed: input.reducedMotion ? 0 : width < 720 ? 0.28 : 0.42,
    interactionRadius: width < 720 ? 120 : 180
  };
}
