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
  const densityCount = Math.round(area / 22000);
  const desktopCount = clamp(densityCount, 32, 58);
  const mobileCount = width < 720 ? 0 : desktopCount;
  const reducedCount = input.reducedMotion ? 0 : mobileCount;

  return {
    count: reducedCount,
    linkDistance: width < 720 ? 0 : 118,
    speed: input.reducedMotion || width < 720 ? 0 : 0.28,
    interactionRadius: width < 720 ? 0 : 150
  };
}
