export type PolicyDecision = { allowed: true } | { allowed: false; reason: string };

const blockedPatterns = [/\/premium/i, /\/private/i, /drm/i, /paid/i, /members-only/i];

export function checkPolicy(url: URL): PolicyDecision {
  const target = `${url.hostname}${url.pathname}${url.search}`;
  const blocked = blockedPatterns.find((pattern) => pattern.test(target));
  if (blocked) {
    return { allowed: false, reason: "This link appears to require private, paid, or DRM-restricted access." };
  }

  return { allowed: true };
}

