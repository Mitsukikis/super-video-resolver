export type PolicyDecision = { allowed: true } | { allowed: false; reason: string };

const blockedPatterns = [/\/premium/i, /\/private/i, /drm/i, /paid/i, /members-only/i];

export function checkPolicy(url: URL): PolicyDecision {
  const target = `${url.hostname}${url.pathname}${url.search}`;
  const blocked = blockedPatterns.find((pattern) => pattern.test(target));
  if (blocked) {
    return { allowed: false, reason: "该链接似乎涉及私密、付费或 DRM 受限内容，本站不提供解析。" };
  }

  return { allowed: true };
}
