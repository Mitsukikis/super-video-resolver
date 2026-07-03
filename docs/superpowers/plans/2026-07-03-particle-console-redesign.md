# Particle Console Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Chinese video resolver homepage into a dark particle-driven control console and update the production access code outside Git.

**Architecture:** Keep all resolver APIs and manifest data structures unchanged. Add a focused Canvas client component for the particle background, a tiny pure helper for particle settings, and a capability strip component for the new console chrome. Apply the visual redesign through existing React components and `globals.css`.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Canvas 2D, Vitest, systemd deployment on Ubuntu.

---

## File Structure

- Create `src/lib/client/particleConfig.ts`: pure functions for responsive particle counts and reduced-motion settings.
- Create `src/components/ParticleField.tsx`: client-only Canvas particle background with mouse interaction and lifecycle cleanup.
- Create `src/components/CapabilityStrip.tsx`: small status strip for supported platforms and no-proxy rules.
- Modify `src/app/page.tsx`: mount particle background and new console header layout.
- Modify `src/app/globals.css`: dark control-console visual system, responsive layout, cards, controls, animation-light effects.
- Modify `src/components/LoginPanel.tsx`: make access code area read as a trusted entrance inside the console.
- Modify `src/components/ResolverForm.tsx`: align form with the new primary console layout.
- Modify `src/components/ResultView.tsx`: keep behavior, restyle through existing classes.
- Modify `src/components/DownloadPanel.tsx`: keep behavior, restyle through existing classes.
- Test `tests/lib/particleConfig.test.ts`: cover the pure particle settings helper.
- Update server secret only in ignored files and production `.env.production`; do not commit the access code.

## Task 1: Particle Settings Helper

**Files:**
- Create: `tests/lib/particleConfig.test.ts`
- Create: `src/lib/client/particleConfig.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/lib/particleConfig.test.ts`

Expected: FAIL because `@/lib/client/particleConfig` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/lib/particleConfig.test.ts`

Expected: PASS.

## Task 2: Canvas Particle Field

**Files:**
- Create: `src/components/ParticleField.tsx`

- [ ] **Step 1: Implement the client component**

Create a client component that:

- Renders `<canvas className="particle-field" aria-hidden="true" />`.
- Uses `getParticleSettings`.
- Registers `resize`, `pointermove`, `pointerleave`, and `visibilitychange`.
- Uses `requestAnimationFrame`.
- Cancels the frame and removes listeners in cleanup.
- Draws particles, links, and pointer attraction with Canvas 2D.

- [ ] **Step 2: Type-check the component**

Run: `npm run typecheck`

Expected: PASS.

## Task 3: Console Shell Components

**Files:**
- Create: `src/components/CapabilityStrip.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add `CapabilityStrip`**

Render four short status items:

```tsx
const capabilities = ["YouTube / Bilibili / X", "服务器不代下载", "浏览器本机合并", "临时 Cookie 不保存"];
```

- [ ] **Step 2: Mount the new shell**

`page.tsx` should render:

- `<ParticleField />`
- `<main className="app-shell">`
- `<section className="hero-console">`
- title/subcopy
- `<CapabilityStrip />`
- `<div className="console-grid">` containing `LoginPanel` and `ResolverForm`

- [ ] **Step 3: Type-check**

Run: `npm run typecheck`

Expected: PASS.

## Task 4: Component Copy and Structure Polish

**Files:**
- Modify: `src/components/LoginPanel.tsx`
- Modify: `src/components/ResolverForm.tsx`

- [ ] **Step 1: Update login panel labels**

Keep the same API behavior. Update visible copy so the access-code form reads as a trusted entrance:

- Title: `可信入口`
- Guest text: `公开链接可直接解析。输入访问码后，可临时使用 Cookie 并获得更高额度。`
- Placeholder: `输入访问码`

- [ ] **Step 2: Update resolver form surface copy**

Keep the same API behavior. Use title `解析控制台` and preserve the existing Chinese no-proxy explanation.

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: PASS.

## Task 5: Dark Console Styling

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace the visual system**

Use CSS variables for dark background, muted text, panel glass, line color, cyan/amber/pink accents, danger, and warning.

- [ ] **Step 2: Add layout styles**

Add styles for:

- `.particle-field`
- `.app-shell`
- `.hero-console`
- `.hero-copy`
- `.title-lockup`
- `.capability-strip`
- `.capability-pill`
- `.console-grid`

- [ ] **Step 3: Restyle existing controls**

Restyle `.panel`, `.input`, `.textarea`, `.button`, `.variant`, `.code-block`, `.error`, `.warning`, `.grid`, `.row`, and mobile media queries.

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: PASS.

## Task 6: Access Code Update

**Files:**
- Modify ignored local record: `work/access-code.txt`
- Modify production server file: `/home/ubuntu/apps/super-video-resolver/.env.production`

- [ ] **Step 1: Update local ignored access-code record**

Set `work/access-code.txt` to the operator-provided access code:

```text
<operator-provided access code>
```

- [ ] **Step 2: Update production environment**

Run:

```bash
ssh ubuntu@82.157.202.171 "python3 - <<'PY'
from pathlib import Path
p = Path('/home/ubuntu/apps/super-video-resolver/.env.production')
lines = p.read_text().splitlines()
for i, line in enumerate(lines):
    if line.startswith('ACCESS_CODE='):
        lines[i] = 'ACCESS_CODE=<operator-provided access code>'
        break
else:
    lines.append('ACCESS_CODE=<operator-provided access code>')
p.write_text('\\n'.join(lines) + '\\n')
p.chmod(0o600)
PY
sudo systemctl restart super-video-resolver"
```

- [ ] **Step 3: Verify login rejects the old code and accepts the new code**

Use HTTP requests against `http://82.157.202.171/api/login`.

Expected: old code returns `{ ok: false }`, new code returns `{ ok: true }`.

## Task 7: Final Verification, Commit, Push, Deploy

**Files:**
- All changed source files.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 2: Commit the redesign**

Run:

```bash
git add src tests docs
git commit -m "feat: add particle console redesign"
```

- [ ] **Step 3: Push to GitHub**

Run: `git push origin main`

- [ ] **Step 4: Deploy by archive**

Run:

```bash
git archive --format=tar -o work/super-video-resolver.tar HEAD
scp work/super-video-resolver.tar ubuntu@82.157.202.171:/tmp/super-video-resolver.tar
scp work/remote-archive-deploy.sh ubuntu@82.157.202.171:/tmp/remote-archive-deploy.sh
ssh ubuntu@82.157.202.171 "bash /tmp/remote-archive-deploy.sh"
```

- [ ] **Step 5: Verify production**

Run:

```bash
curl.exe --noproxy "*" -I --max-time 15 http://82.157.202.171
node -e "fetch('http://82.157.202.171').then(r=>r.text()).then(t=>console.log({title:t.includes('超级视频解析'), particle:t.includes('particle-field')}))"
ssh ubuntu@82.157.202.171 "systemctl is-active super-video-resolver"
```

Expected: HTTP 200, title and particle marker true, service active.
