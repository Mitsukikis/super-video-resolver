# Super Video Resolver MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a public MVP of the video resolver site that returns HD media manifests, supports temporary per-request cookies, offers browser-side merging when possible, and falls back to local-tool commands without proxying video traffic through the server.

**Architecture:** Use a Next.js TypeScript app with one stable resolve API and isolated resolver plugins. The initial platform plugins are X/Twitter, Bilibili, and YouTube, implemented as thin profiles over `yt-dlp --dump-single-json` so the server extracts metadata and direct media URLs but never downloads video files. The browser consumes a normalized manifest, attempts local merge with lazy-loaded ffmpeg.wasm when CORS and device constraints allow, and otherwise shows direct links and local commands.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Zod, yt-dlp CLI, ffmpeg.wasm, Node.js 22+ on Ubuntu, systemd service, GitHub repo `Mitsukikis/super-video-resolver`, public test port `3000`.

---

## Confirmed Environment

- Local workspace: `C:\Users\35559\Documents\Codex\2026-07-03\https-twittervideodownloader-com-en`
- GitHub CLI: logged in as `Mitsukikis`, repo scope available, SSH git protocol.
- Server SSH: `ubuntu@82.157.202.171` works with key auth.
- Server sudo: `ubuntu` can run passwordless sudo.
- Server currently has `git`; Node/npm/pnpm/pm2 were not present in the quick check.
- Server port `3000` was not shown as occupied. Existing public listeners include `22`, `6099`, `6100`, `6185`, `6199`, `6200`, and `18080`.

## References

- yt-dlp official repository and options: https://github.com/yt-dlp/yt-dlp
- Product design spec: `docs/superpowers/specs/2026-07-03-super-video-resolver-design.md`

## MVP Scope

Included:

- Public landing app that is the actual resolver UI, not a marketing page.
- URL detection for X/Twitter, Bilibili, and YouTube.
- Resolver registry and normalized manifest contract.
- `yt-dlp` metadata extraction with no media download.
- Temporary cookie input for logged-in users only.
- Simple MVP login using an access code stored in `.env.production`; replaceable with OAuth later.
- Cookie redaction and no cookie persistence.
- In-memory MVP rate limits, with clear interface for Redis later.
- Result viewer with quality variants, split video/audio tracks, warnings, and fallback commands.
- Browser-side merge attempt with capability checks and lazy ffmpeg.wasm.
- GitHub push.
- Deployment to `ubuntu@82.157.202.171` on `0.0.0.0:3000`.

Excluded from this first plan:

- Douyin, Kuaishou, Xiaohongshu, Weibo, TikTok, Instagram, and Facebook plugins.
- Production OAuth/member billing.
- Redis/PostgreSQL persistence.
- Server-side video proxying, storage, download, merge, or transcoding.

---

## File Structure

Create:

- `.gitignore` - ignore dependencies, build output, env files, and local brainstorm artifacts.
- `.env.example` - document required environment variables.
- `package.json` - scripts and dependencies.
- `tsconfig.json` - strict TypeScript config.
- `next.config.ts` - Next config and headers needed by ffmpeg.wasm where feasible.
- `vitest.config.ts` - unit test config.
- `README.md` - local dev, deploy, and safety notes.
- `src/app/globals.css` - app styling.
- `src/app/layout.tsx` - root layout.
- `src/app/page.tsx` - resolver UI.
- `src/app/api/login/route.ts` - access-code login.
- `src/app/api/logout/route.ts` - clear login cookie.
- `src/app/api/resolve/route.ts` - resolve endpoint.
- `src/components/ResolverForm.tsx` - URL and optional cookie input.
- `src/components/ResultView.tsx` - manifest display.
- `src/components/DownloadPanel.tsx` - direct save, browser merge, fallback commands.
- `src/components/LoginPanel.tsx` - MVP access-code login.
- `src/lib/auth.ts` - signed access-code session helpers.
- `src/lib/command.ts` - fallback command builders.
- `src/lib/manifest.ts` - Zod schemas and TypeScript types.
- `src/lib/platform.ts` - URL normalization and platform detection.
- `src/lib/policy.ts` - policy gate for blocked content patterns.
- `src/lib/rateLimit.ts` - in-memory rate limiter.
- `src/lib/redact.ts` - log and error redaction helpers.
- `src/lib/resolvers/registry.ts` - resolver plugin registry.
- `src/lib/resolvers/types.ts` - resolver plugin contract.
- `src/lib/resolvers/ytDlp.ts` - yt-dlp adapter and manifest conversion.
- `src/lib/resolvers/profiles.ts` - X/Twitter, Bilibili, YouTube profiles.
- `src/lib/server/resolveService.ts` - API orchestration.
- `src/lib/client/browserMerge.ts` - browser capability and merge helpers.
- `src/lib/client/mergeWorker.ts` - ffmpeg.wasm worker entry.
- `tests/fixtures/yt-dlp-youtube.json` - representative yt-dlp output.
- `tests/fixtures/yt-dlp-bilibili.json` - representative yt-dlp output.
- `tests/fixtures/yt-dlp-x.json` - representative yt-dlp output.
- `tests/lib/manifest.test.ts` - schema tests.
- `tests/lib/platform.test.ts` - URL detection tests.
- `tests/lib/redact.test.ts` - sensitive data redaction tests.
- `tests/lib/command.test.ts` - fallback command tests.
- `tests/lib/rateLimit.test.ts` - quota behavior tests.
- `tests/lib/ytDlp.test.ts` - fixture conversion tests.
- `tests/lib/resolveService.test.ts` - service-level behavior with fake plugins.
- `deploy/super-video-resolver.service` - systemd service template.
- `deploy/provision-ubuntu.sh` - install Node 22, yt-dlp, and firewall rule.
- `deploy/deploy.sh` - pull/build/restart commands on server.

---

### Task 1: Initialize Repository And Project Shell

**Files:**

- Create: `.gitignore`
- Create: `.env.example`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `README.md`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Initialize git if needed**

Run:

```powershell
git init
git branch -M main
```

Expected: repository initialized on `main`.

- [ ] **Step 2: Write `.gitignore`**

```gitignore
node_modules/
.next/
out/
coverage/
.env
.env.*
!.env.example
.DS_Store
Thumbs.db
.superpowers/
*.log
```

- [ ] **Step 3: Write `.env.example`**

```dotenv
APP_BASE_URL=http://localhost:3000
ACCESS_CODE=change-me
AUTH_SECRET=change-this-long-random-secret
YT_DLP_BIN=yt-dlp
RESOLVE_TIMEOUT_MS=25000
NEXT_PUBLIC_APP_NAME=Super Video Resolver
```

- [ ] **Step 4: Write `package.json`**

```json
{
  "name": "super-video-resolver",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "build": "next build",
    "start": "next start -H 0.0.0.0",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@ffmpeg/ffmpeg": "^0.12.15",
    "@ffmpeg/util": "^0.12.2",
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.2.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^26.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 5: Write TypeScript and Vitest config**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 6: Write Next config, root layout, global CSS, and README**

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" }
        ]
      }
    ];
  }
};

export default nextConfig;
```

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Super Video Resolver",
  description: "Parse supported video links and download on your own device."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/globals.css`:

```css
:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --text: #171717;
  --muted: #5e6673;
  --line: #d9dde4;
  --panel: #ffffff;
  --accent: #1a7f64;
  --accent-strong: #125a47;
  --danger: #b42318;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 32px;
}

.resolver-surface {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: 20px;
}

.eyebrow {
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 40px;
  line-height: 1.08;
}

.subcopy {
  max-width: 720px;
  color: var(--muted);
}
```

`README.md`:

```markdown
# Super Video Resolver

Public MVP for resolving supported video links into a normalized manifest. The server extracts metadata and direct media information only. It does not proxy, store, download, or merge video files.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Safety Rules

- No server-side video proxying.
- No persistent cookies.
- Temporary cookies are accepted only for logged-in resolve requests.
- DRM, private, and paid-wall bypass flows are blocked.

## Server

Default public test URL: `http://82.157.202.171:3000`.
```

- [ ] **Step 7: Install dependencies**

Run:

```powershell
npm install
```

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 8: Commit project shell**

```powershell
git add .gitignore .env.example package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts README.md src/app/layout.tsx src/app/globals.css
git commit -m "chore: scaffold resolver app"
```

Expected: first commit created.

---

### Task 2: Define Manifest Contract

**Files:**

- Create: `src/lib/manifest.ts`
- Create: `tests/lib/manifest.test.ts`

- [ ] **Step 1: Write failing schema tests**

```ts
import { describe, expect, it } from "vitest";
import { ManifestSchema } from "@/lib/manifest";

describe("ManifestSchema", () => {
  it("accepts a split HD variant", () => {
    const result = ManifestSchema.safeParse({
      sourceUrl: "https://www.youtube.com/watch?v=abc123",
      platform: "youtube",
      title: "Example",
      variants: [{
        id: "1080p",
        label: "1080p",
        action: "browser-merge",
        kind: "split",
        videoTrackId: "v1",
        audioTrackId: "a1",
        width: 1920,
        height: 1080,
        container: "mp4"
      }],
      tracks: [
        { id: "v1", kind: "video", url: "https://video.example/v.mp4", container: "mp4", codec: "avc1" },
        { id: "a1", kind: "audio", url: "https://video.example/a.m4a", container: "m4a", codec: "mp4a" }
      ],
      warnings: [],
      fallbacks: []
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npm test -- tests/lib/manifest.test.ts
```

Expected: FAIL because `@/lib/manifest` does not exist.

- [ ] **Step 3: Implement `src/lib/manifest.ts`**

```ts
import { z } from "zod";

export const PlatformSchema = z.enum(["x", "bilibili", "youtube"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const TrackSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["video", "audio", "combined", "hls", "dash"]),
  url: z.string().url(),
  container: z.string().optional(),
  codec: z.string().optional(),
  bitrateKbps: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fps: z.number().positive().optional(),
  sizeBytes: z.number().int().positive().optional(),
  headers: z.record(z.string()).optional(),
  expiresAt: z.string().datetime().optional()
});
export type Track = z.infer<typeof TrackSchema>;

export const VariantSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["combined", "split", "stream"]),
  action: z.enum(["direct-save", "browser-merge", "local-tool", "unsupported"]),
  videoTrackId: z.string().optional(),
  audioTrackId: z.string().optional(),
  combinedTrackId: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fps: z.number().positive().optional(),
  bitrateKbps: z.number().int().positive().optional(),
  container: z.string().optional(),
  sizeBytes: z.number().int().positive().optional()
});
export type Variant = z.infer<typeof VariantSchema>;

export const FallbackSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  command: z.string().min(1),
  containsSensitiveData: z.boolean().default(false)
});
export type Fallback = z.infer<typeof FallbackSchema>;

export const ManifestSchema = z.object({
  sourceUrl: z.string().url(),
  platform: PlatformSchema,
  title: z.string().min(1),
  author: z.string().optional(),
  durationSeconds: z.number().positive().optional(),
  thumbnailUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  variants: z.array(VariantSchema),
  tracks: z.array(TrackSchema),
  warnings: z.array(z.string()),
  fallbacks: z.array(FallbackSchema)
});
export type Manifest = z.infer<typeof ManifestSchema>;
```

- [ ] **Step 4: Run test and verify pass**

Run:

```powershell
npm test -- tests/lib/manifest.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit manifest contract**

```powershell
git add src/lib/manifest.ts tests/lib/manifest.test.ts
git commit -m "feat: define media manifest contract"
```

---

### Task 3: Platform Detection, Policy Gate, Redaction, And Rate Limits

**Files:**

- Create: `src/lib/platform.ts`
- Create: `src/lib/policy.ts`
- Create: `src/lib/redact.ts`
- Create: `src/lib/rateLimit.ts`
- Create: `tests/lib/platform.test.ts`
- Create: `tests/lib/redact.test.ts`
- Create: `tests/lib/rateLimit.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/lib/platform.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { detectPlatform, normalizeInputUrl } from "@/lib/platform";

describe("platform detection", () => {
  it("detects youtube, bilibili, and x links", () => {
    expect(detectPlatform(new URL("https://www.youtube.com/watch?v=abc"))).toBe("youtube");
    expect(detectPlatform(new URL("https://youtu.be/abc"))).toBe("youtube");
    expect(detectPlatform(new URL("https://www.bilibili.com/video/BV1xx"))).toBe("bilibili");
    expect(detectPlatform(new URL("https://x.com/user/status/1"))).toBe("x");
    expect(detectPlatform(new URL("https://twitter.com/user/status/1"))).toBe("x");
  });

  it("normalizes missing protocol", () => {
    expect(normalizeInputUrl("youtube.com/watch?v=abc").hostname).toBe("youtube.com");
  });
});
```

`tests/lib/redact.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { redactHeaders, redactUrl } from "@/lib/redact";

describe("redaction", () => {
  it("redacts cookie-like headers and signed query params", () => {
    expect(redactHeaders({ cookie: "a=b", authorization: "Bearer x", accept: "json" })).toEqual({
      cookie: "[redacted]",
      authorization: "[redacted]",
      accept: "json"
    });
    expect(redactUrl("https://e.test/video.mp4?token=abc&x=1")).toBe("https://e.test/video.mp4?token=%5Bredacted%5D&x=1");
  });
});
```

`tests/lib/rateLimit.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- tests/lib/platform.test.ts tests/lib/redact.test.ts tests/lib/rateLimit.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement modules**

`src/lib/platform.ts`:

```ts
import type { Platform } from "./manifest";

export function normalizeInputUrl(input: string): URL {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol);
}

export function detectPlatform(url: URL): Platform | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "youtube";
  if (host === "bilibili.com" || host.endsWith(".bilibili.com")) return "bilibili";
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".twitter.com")) return "x";
  return null;
}
```

`src/lib/policy.ts`:

```ts
export type PolicyDecision = { allowed: true } | { allowed: false; reason: string };

const blockedPatterns = [
  /\/premium/i,
  /\/private/i,
  /drm/i,
  /paid/i
];

export function checkPolicy(url: URL): PolicyDecision {
  const target = `${url.hostname}${url.pathname}${url.search}`;
  const blocked = blockedPatterns.find((pattern) => pattern.test(target));
  if (blocked) {
    return { allowed: false, reason: "This link appears to require private, paid, or DRM-restricted access." };
  }
  return { allowed: true };
}
```

`src/lib/redact.ts`:

```ts
const sensitiveHeaderNames = new Set(["cookie", "authorization", "x-goog-authuser", "x-youtube-identity-token"]);
const sensitiveQueryNames = new Set(["token", "sig", "signature", "key", "auth", "expires"]);

export function redactHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      sensitiveHeaderNames.has(key.toLowerCase()) && value ? "[redacted]" : value
    ])
  );
}

export function redactUrl(input: string): string {
  const url = new URL(input);
  for (const key of [...url.searchParams.keys()]) {
    if (sensitiveQueryNames.has(key.toLowerCase())) {
      url.searchParams.set(key, "[redacted]");
    }
  }
  return url.toString();
}
```

`src/lib/rateLimit.ts`:

```ts
type Bucket = { count: number; resetAt: number };

export class MemoryRateLimiter {
  private buckets = new Map<string, Bucket>();

  check(key: string, limit: number, windowMs: number, now = Date.now()) {
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      const bucket = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
      return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
    }

    if (current.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: current.resetAt };
    }

    current.count += 1;
    return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
  }
}

export const resolveRateLimiter = new MemoryRateLimiter();
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```powershell
npm test -- tests/lib/platform.test.ts tests/lib/redact.test.ts tests/lib/rateLimit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit safety utilities**

```powershell
git add src/lib/platform.ts src/lib/policy.ts src/lib/redact.ts src/lib/rateLimit.ts tests/lib/platform.test.ts tests/lib/redact.test.ts tests/lib/rateLimit.test.ts
git commit -m "feat: add resolver safety utilities"
```

---

### Task 4: Implement Resolver Registry And yt-dlp Adapter

**Files:**

- Create: `src/lib/resolvers/types.ts`
- Create: `src/lib/resolvers/profiles.ts`
- Create: `src/lib/resolvers/registry.ts`
- Create: `src/lib/resolvers/ytDlp.ts`
- Create: `src/lib/command.ts`
- Create: `tests/fixtures/yt-dlp-youtube.json`
- Create: `tests/fixtures/yt-dlp-bilibili.json`
- Create: `tests/fixtures/yt-dlp-x.json`
- Create: `tests/lib/ytDlp.test.ts`
- Create: `tests/lib/command.test.ts`

- [ ] **Step 1: Write fixture conversion tests**

Use compact fixture JSON files shaped like yt-dlp output:

```json
{
  "webpage_url": "https://www.youtube.com/watch?v=abc",
  "extractor_key": "Youtube",
  "title": "Fixture Video",
  "uploader": "Fixture Author",
  "duration": 120,
  "thumbnail": "https://i.example/thumb.jpg",
  "formats": [
    {
      "format_id": "137",
      "url": "https://media.example/video.mp4",
      "ext": "mp4",
      "vcodec": "avc1.640028",
      "acodec": "none",
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "tbr": 4500
    },
    {
      "format_id": "140",
      "url": "https://media.example/audio.m4a",
      "ext": "m4a",
      "vcodec": "none",
      "acodec": "mp4a.40.2",
      "abr": 128
    },
    {
      "format_id": "18",
      "url": "https://media.example/combined.mp4",
      "ext": "mp4",
      "vcodec": "avc1.42001E",
      "acodec": "mp4a.40.2",
      "width": 640,
      "height": 360,
      "tbr": 600
    }
  ]
}
```

`tests/lib/ytDlp.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { convertYtDlpInfoToManifest } from "@/lib/resolvers/ytDlp";

describe("convertYtDlpInfoToManifest", () => {
  it("creates combined and split variants", () => {
    const info = JSON.parse(readFileSync("tests/fixtures/yt-dlp-youtube.json", "utf8"));
    const manifest = convertYtDlpInfoToManifest(info, "youtube", "https://www.youtube.com/watch?v=abc", false);

    expect(manifest.title).toBe("Fixture Video");
    expect(manifest.tracks.some((track) => track.kind === "combined")).toBe(true);
    expect(manifest.variants.some((variant) => variant.action === "browser-merge")).toBe(true);
    expect(manifest.fallbacks.some((fallback) => fallback.id === "yt-dlp")).toBe(true);
  });
});
```

- [ ] **Step 2: Write fallback command tests**

`tests/lib/command.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildFallbacks } from "@/lib/command";

describe("buildFallbacks", () => {
  it("creates safe commands without cookies by default", () => {
    const fallbacks = buildFallbacks("https://www.youtube.com/watch?v=abc", false);
    expect(fallbacks.map((fallback) => fallback.id)).toEqual(["yt-dlp", "aria2"]);
    expect(fallbacks.every((fallback) => fallback.containsSensitiveData === false)).toBe(true);
    expect(fallbacks[0].command).toContain("yt-dlp");
  });

  it("marks cookie-aware command guidance as sensitive", () => {
    const fallbacks = buildFallbacks("https://www.youtube.com/watch?v=abc", true);
    expect(fallbacks.some((fallback) => fallback.containsSensitiveData)).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```powershell
npm test -- tests/lib/command.test.ts tests/lib/ytDlp.test.ts
```

Expected: FAIL because resolver modules do not exist.

- [ ] **Step 4: Implement fallback command builder**

`src/lib/command.ts`:

```ts
import type { Fallback } from "@/lib/manifest";

function quote(value: string) {
  return `"${value.replaceAll('"', '\\"')}"`;
}

export function buildFallbacks(sourceUrl: string, containsCookie: boolean): Fallback[] {
  const base: Fallback[] = [
    {
      id: "yt-dlp",
      label: "yt-dlp",
      command: `yt-dlp --no-playlist -f "bv*+ba/b" ${quote(sourceUrl)}`,
      containsSensitiveData: false
    },
    {
      id: "aria2",
      label: "aria2",
      command: `aria2c ${quote(sourceUrl)}`,
      containsSensitiveData: false
    }
  ];

  if (containsCookie) {
    base.push({
      id: "yt-dlp-cookies",
      label: "yt-dlp with local cookies",
      command: `yt-dlp --cookies cookies.txt --no-playlist -f "bv*+ba/b" ${quote(sourceUrl)}`,
      containsSensitiveData: true
    });
  }

  return base;
}
```

- [ ] **Step 5: Implement resolver contract and profiles**

`src/lib/resolvers/types.ts`:

```ts
import type { Manifest, Platform } from "@/lib/manifest";

export type ResolveInput = {
  url: URL;
  platform: Platform;
  temporaryCookie?: string;
  requestId: string;
};

export type ResolverCapabilities = {
  supportsTemporaryCookie: boolean;
  commonBrowserFetch: "likely" | "mixed" | "unlikely";
  outputTypes: Array<"combined" | "split" | "hls" | "dash">;
};

export type ResolverPlugin = {
  id: Platform;
  displayName: string;
  capabilities: ResolverCapabilities;
  match(url: URL): boolean;
  resolve(input: ResolveInput): Promise<Manifest>;
};
```

`src/lib/resolvers/profiles.ts`:

```ts
import type { Platform } from "@/lib/manifest";

export const resolverProfiles: Record<Platform, { displayName: string; domains: string[] }> = {
  youtube: { displayName: "YouTube", domains: ["youtube.com", "youtu.be"] },
  bilibili: { displayName: "Bilibili", domains: ["bilibili.com"] },
  x: { displayName: "X / Twitter", domains: ["x.com", "twitter.com"] }
};
```

- [ ] **Step 6: Implement yt-dlp conversion and spawn adapter**

`src/lib/resolvers/ytDlp.ts` must:

- Build command arguments as an array, never as shell string.
- Use `--dump-single-json`, `--no-playlist`, and timeouts.
- Use a temp cookie file only when needed.
- Delete the temp cookie file in `finally`.
- Convert formats into normalized tracks and variants.
- Generate fallback commands from the source URL.

Core conversion function:

```ts
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Manifest, Platform, Track, Variant } from "@/lib/manifest";
import type { ResolveInput, ResolverPlugin } from "./types";
import { buildFallbacks } from "@/lib/command";

type YtDlpFormat = {
  format_id?: string;
  url?: string;
  ext?: string;
  vcodec?: string;
  acodec?: string;
  width?: number;
  height?: number;
  fps?: number;
  tbr?: number;
  abr?: number;
  filesize?: number;
  filesize_approx?: number;
  protocol?: string;
};

type YtDlpInfo = {
  webpage_url?: string;
  title?: string;
  uploader?: string;
  duration?: number;
  thumbnail?: string;
  formats?: YtDlpFormat[];
};

export function convertYtDlpInfoToManifest(
  info: YtDlpInfo,
  platform: Platform,
  sourceUrl: string,
  containsCookie: boolean
): Manifest {
  const tracks: Track[] = [];

  for (const format of info.formats ?? []) {
    if (!format.url || !format.format_id) continue;
    const hasVideo = format.vcodec && format.vcodec !== "none";
    const hasAudio = format.acodec && format.acodec !== "none";
    const kind = hasVideo && hasAudio ? "combined" : hasVideo ? "video" : hasAudio ? "audio" : "hls";

    tracks.push({
      id: format.format_id,
      kind,
      url: format.url,
      container: format.ext,
      codec: [format.vcodec, format.acodec].filter(Boolean).filter((value) => value !== "none").join(",") || undefined,
      bitrateKbps: Math.round(format.tbr ?? format.abr ?? 0) || undefined,
      width: format.width,
      height: format.height,
      fps: format.fps,
      sizeBytes: format.filesize ?? format.filesize_approx
    });
  }

  const videoTracks = tracks.filter((track) => track.kind === "video").sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  const audioTracks = tracks.filter((track) => track.kind === "audio").sort((a, b) => (b.bitrateKbps ?? 0) - (a.bitrateKbps ?? 0));
  const combinedTracks = tracks.filter((track) => track.kind === "combined").sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  const variants: Variant[] = [
    ...combinedTracks.map((track) => ({
      id: `combined-${track.id}`,
      label: track.height ? `${track.height}p combined` : `Combined ${track.id}`,
      kind: "combined" as const,
      action: "direct-save" as const,
      combinedTrackId: track.id,
      width: track.width,
      height: track.height,
      fps: track.fps,
      bitrateKbps: track.bitrateKbps,
      container: track.container,
      sizeBytes: track.sizeBytes
    }))
  ];

  const bestAudio = audioTracks[0];
  for (const video of videoTracks) {
    if (!bestAudio) continue;
    variants.push({
      id: `split-${video.id}-${bestAudio.id}`,
      label: video.height ? `${video.height}p video + audio` : `Split ${video.id} + ${bestAudio.id}`,
      kind: "split",
      action: "browser-merge",
      videoTrackId: video.id,
      audioTrackId: bestAudio.id,
      width: video.width,
      height: video.height,
      fps: video.fps,
      bitrateKbps: video.bitrateKbps,
      container: "mp4",
      sizeBytes: video.sizeBytes && bestAudio.sizeBytes ? video.sizeBytes + bestAudio.sizeBytes : undefined
    });
  }

  return {
    sourceUrl,
    platform,
    title: info.title ?? "Untitled video",
    author: info.uploader,
    durationSeconds: info.duration,
    thumbnailUrl: info.thumbnail,
    variants,
    tracks,
    warnings: containsCookie ? ["This result used a temporary cookie. Do not share generated commands containing cookies."] : [],
    fallbacks: buildFallbacks(sourceUrl, containsCookie)
  };
}
```

- [ ] **Step 7: Run conversion tests**

Run:

```powershell
npm test -- tests/lib/command.test.ts tests/lib/ytDlp.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit resolver foundation**

```powershell
git add src/lib/resolvers src/lib/command.ts tests/fixtures tests/lib/command.test.ts tests/lib/ytDlp.test.ts
git commit -m "feat: add yt-dlp resolver foundation"
```

---

### Task 5: Build Resolve Service And API Route

**Files:**

- Create: `src/lib/server/resolveService.ts`
- Create: `src/app/api/resolve/route.ts`
- Create: `tests/lib/resolveService.test.ts`

- [ ] **Step 1: Write service tests with a fake plugin**

```ts
import { describe, expect, it } from "vitest";
import { createResolveService } from "@/lib/server/resolveService";

describe("resolveService", () => {
  it("rejects unsupported platforms", async () => {
    const service = createResolveService([]);
    await expect(service.resolve({ url: "https://example.com/video", ip: "1.1.1.1" })).rejects.toThrow("Unsupported platform");
  });

  it("requires login for temporary cookies", async () => {
    const service = createResolveService([]);
    await expect(service.resolve({
      url: "https://www.youtube.com/watch?v=abc",
      ip: "1.1.1.1",
      temporaryCookie: "SID=x"
    })).rejects.toThrow("Login is required");
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npm test -- tests/lib/resolveService.test.ts
```

Expected: FAIL because resolve service does not exist.

- [ ] **Step 3: Implement resolve service**

`createResolveService` should:

- Normalize URL.
- Detect platform.
- Check policy.
- Apply quota: guest 20/hour, logged-in 100/hour, cookie-enabled 20/hour.
- Reject cookie use when `isLoggedIn` is false.
- Select plugin by platform.
- Return manifest.

Core shape:

```ts
import { randomUUID } from "node:crypto";
import { detectPlatform, normalizeInputUrl } from "@/lib/platform";
import { checkPolicy } from "@/lib/policy";
import { resolveRateLimiter } from "@/lib/rateLimit";
import type { Manifest } from "@/lib/manifest";
import type { ResolverPlugin } from "@/lib/resolvers/types";

export type ResolveRequest = {
  url: string;
  ip: string;
  isLoggedIn?: boolean;
  temporaryCookie?: string;
};

export function createResolveService(plugins: ResolverPlugin[]) {
  return {
    async resolve(request: ResolveRequest): Promise<Manifest> {
      const url = normalizeInputUrl(request.url);
      const platform = detectPlatform(url);
      if (!platform) throw new Error("Unsupported platform");

      const policy = checkPolicy(url);
      if (!policy.allowed) throw new Error(policy.reason);

      if (request.temporaryCookie && !request.isLoggedIn) {
        throw new Error("Login is required for temporary cookie parsing");
      }

      const limit = request.temporaryCookie ? 20 : request.isLoggedIn ? 100 : 20;
      const rate = resolveRateLimiter.check(`${request.ip}:${platform}:${request.isLoggedIn ? "user" : "guest"}`, limit, 60 * 60 * 1000);
      if (!rate.allowed) throw new Error("Rate limit exceeded");

      const plugin = plugins.find((candidate) => candidate.id === platform && candidate.match(url));
      if (!plugin) throw new Error("Resolver unavailable");

      return plugin.resolve({
        url,
        platform,
        temporaryCookie: request.temporaryCookie,
        requestId: randomUUID()
      });
    }
  };
}
```

- [ ] **Step 4: Implement API route**

`src/app/api/resolve/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import { resolverPlugins } from "@/lib/resolvers/registry";
import { createResolveService } from "@/lib/server/resolveService";

const service = createResolveService(resolverPlugins);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const manifest = await service.resolve({
      url: String(body.url ?? ""),
      temporaryCookie: body.temporaryCookie ? String(body.temporaryCookie) : undefined,
      isLoggedIn: await isLoggedIn(),
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    });

    return NextResponse.json({ ok: true, manifest });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Resolve failed" },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 5: Run tests**

Run:

```powershell
npm test -- tests/lib/resolveService.test.ts
npm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit resolve API**

```powershell
git add src/lib/server/resolveService.ts src/app/api/resolve/route.ts tests/lib/resolveService.test.ts
git commit -m "feat: add resolve service and api"
```

---

### Task 6: Add MVP Access-Code Login

**Files:**

- Create: `src/lib/auth.ts`
- Create: `src/app/api/login/route.ts`
- Create: `src/app/api/logout/route.ts`
- Create: `src/components/LoginPanel.tsx`

- [ ] **Step 1: Implement signed session helpers**

`src/lib/auth.ts`:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "svr_session";

function secret() {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

export function signSession(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function makeSessionToken() {
  const value = `logged-in:${Date.now()}`;
  return `${value}.${signSession(value)}`;
}

export async function isLoggedIn() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;
  const [value, signature] = token.split(".");
  if (!value || !signature) return false;
  const expected = signSession(value);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export { cookieName };
```

- [ ] **Step 2: Implement login/logout routes**

`src/app/api/login/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { cookieName, makeSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!process.env.ACCESS_CODE || body.accessCode !== process.env.ACCESS_CODE) {
    return NextResponse.json({ ok: false, error: "Invalid access code" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, makeSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
```

`src/app/api/logout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { cookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(cookieName);
  return response;
}
```

- [ ] **Step 3: Verify typecheck**

Run:

```powershell
npm typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit login**

```powershell
git add src/lib/auth.ts src/app/api/login/route.ts src/app/api/logout/route.ts src/components/LoginPanel.tsx
git commit -m "feat: add access-code login"
```

---

### Task 7: Build Resolver UI And Result Views

**Files:**

- Create: `src/components/ResolverForm.tsx`
- Create: `src/components/ResultView.tsx`
- Create: `src/components/DownloadPanel.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Implement client form**

`ResolverForm` should:

- Accept URL input.
- Let logged-in users paste temporary cookies.
- Warn that cookies are never stored.
- POST to `/api/resolve`.
- Keep errors visible.

Component state shape:

```ts
type ResolveState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; manifest: Manifest };
```

- [ ] **Step 2: Implement result viewer**

`ResultView` should:

- Show title, author, thumbnail, duration.
- Group variants by action.
- Show warnings.
- Pass selected variant and manifest to `DownloadPanel`.

- [ ] **Step 3: Implement download panel**

`DownloadPanel` should:

- Offer direct link for `direct-save`.
- Offer browser merge for `browser-merge`.
- Show track URLs in an advanced section.
- Show fallback command copy blocks.
- Explain CORS/device failures from the browser merge helper.

- [ ] **Step 4: Implement page**

`src/app/page.tsx` should render the usable app immediately:

```tsx
import { isLoggedIn } from "@/lib/auth";
import { LoginPanel } from "@/components/LoginPanel";
import { ResolverForm } from "@/components/ResolverForm";

export default async function HomePage() {
  const loggedIn = await isLoggedIn();
  return (
    <main className="app-shell">
      <section className="resolver-surface">
        <div>
          <p className="eyebrow">No server video proxy</p>
          <h1>Super Video Resolver</h1>
          <p className="subcopy">Parse supported video links, pick HD tracks, merge in your browser when possible, or copy local-tool commands.</p>
        </div>
        <LoginPanel loggedIn={loggedIn} />
        <ResolverForm loggedIn={loggedIn} />
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Run verification**

Run:

```powershell
npm typecheck
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 6: Commit UI**

```powershell
git add src/app src/components
git commit -m "feat: build resolver interface"
```

---

### Task 8: Add Browser Merge Helper

**Files:**

- Create: `src/lib/client/browserMerge.ts`
- Create: `src/lib/client/mergeWorker.ts`
- Modify: `src/components/DownloadPanel.tsx`
- Modify: `next.config.ts`

- [ ] **Step 1: Implement capability checks**

`browserMerge.ts` should expose:

```ts
export type BrowserMergeCheck =
  | { ok: true }
  | { ok: false; reason: "cors" | "storage" | "format" | "missing-track" | "unsupported-browser"; message: string };

export async function checkBrowserMerge(videoUrl: string, audioUrl: string): Promise<BrowserMergeCheck> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "unsupported-browser", message: "Browser merge can only run in the browser." };
  }

  try {
    await Promise.all([
      fetch(videoUrl, { method: "HEAD", mode: "cors" }),
      fetch(audioUrl, { method: "HEAD", mode: "cors" })
    ]);
    return { ok: true };
  } catch {
    return { ok: false, reason: "cors", message: "The source platform blocked browser fetch. Use a local-tool fallback." };
  }
}
```

- [ ] **Step 2: Implement lazy ffmpeg merge path**

`mergeWorker.ts` should lazy-load `@ffmpeg/ffmpeg` and `@ffmpeg/util`, fetch video/audio URLs, run ffmpeg with copy codecs where possible, and post progress messages back to the UI.

Worker command shape:

```ts
await ffmpeg.exec(["-i", "video.mp4", "-i", "audio.m4a", "-c", "copy", "output.mp4"]);
```

- [ ] **Step 3: Wire `DownloadPanel`**

Only enable browser merge when:

- Variant kind is `split`.
- Video and audio track IDs exist.
- Capability check succeeds.
- User explicitly clicks the merge button.

- [ ] **Step 4: Build and manually verify with fixture manifest**

Run:

```powershell
npm run build
```

Expected: build succeeds. UI shows a clear fallback message if CORS blocks the fixture URLs.

- [ ] **Step 5: Commit browser merge**

```powershell
git add src/lib/client src/components/DownloadPanel.tsx next.config.ts
git commit -m "feat: add browser-side merge workflow"
```

---

### Task 9: Add Deployment Files

**Files:**

- Create: `deploy/provision-ubuntu.sh`
- Create: `deploy/deploy.sh`
- Create: `deploy/super-video-resolver.service`
- Modify: `README.md`

- [ ] **Step 1: Write provisioning script**

`deploy/provision-ubuntu.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs python3 python3-pip python3-venv ffmpeg
python3 -m pip install --user --upgrade yt-dlp
sudo ufw allow 3000/tcp || true
node -v
npm -v
~/.local/bin/yt-dlp --version
ffmpeg -version | head -1
```

- [ ] **Step 2: Write systemd service**

`deploy/super-video-resolver.service`:

```ini
[Unit]
Description=Super Video Resolver
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/super-video-resolver
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=YT_DLP_BIN=/home/ubuntu/.local/bin/yt-dlp
ExecStart=/usr/bin/npm run start -- -p 3000 -H 0.0.0.0
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 3: Write deploy script**

`deploy/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/ubuntu/apps/super-video-resolver
REPO_URL=git@github.com:Mitsukikis/super-video-resolver.git

mkdir -p /home/ubuntu/apps
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main
npm ci
npm run build
sudo cp deploy/super-video-resolver.service /etc/systemd/system/super-video-resolver.service
sudo systemctl daemon-reload
sudo systemctl enable super-video-resolver
sudo systemctl restart super-video-resolver
sudo systemctl status super-video-resolver --no-pager
```

- [ ] **Step 4: Commit deployment files**

```powershell
git add deploy README.md
git commit -m "chore: add ubuntu deployment"
```

---

### Task 10: Create GitHub Repo And Push

**Files:**

- No file changes unless GitHub remote already exists and needs correction.

- [ ] **Step 1: Create repo if missing**

Run:

```powershell
gh repo view Mitsukikis/super-video-resolver
```

If it fails, run:

```powershell
gh repo create Mitsukikis/super-video-resolver --public --source . --remote origin --push
```

Expected: public repo exists and local `origin` is set.

- [ ] **Step 2: Push current branch**

Run:

```powershell
git push -u origin main
```

Expected: code available at `https://github.com/Mitsukikis/super-video-resolver`.

---

### Task 11: Provision And Deploy Server

**Files:**

- Remote file: `/home/ubuntu/apps/super-video-resolver/.env.production`
- Remote systemd service: `/etc/systemd/system/super-video-resolver.service`

- [ ] **Step 1: Run provisioning**

Run:

```powershell
scp deploy/provision-ubuntu.sh ubuntu@82.157.202.171:/tmp/provision-super-video-resolver.sh
ssh ubuntu@82.157.202.171 "bash /tmp/provision-super-video-resolver.sh"
```

Expected:

- Node 22 prints a version.
- npm prints a version.
- yt-dlp prints a version.
- ffmpeg prints a version.
- UFW allows `3000/tcp` or reports UFW is inactive.

- [ ] **Step 2: Ensure server can pull GitHub**

Run:

```powershell
ssh ubuntu@82.157.202.171 "ssh -T git@github.com || true"
```

Expected: GitHub accepts the server key, or prints a key/permission error. If it fails, add a deploy key to GitHub or switch `REPO_URL` in deploy script to HTTPS for public clone.

- [ ] **Step 3: Create production env**

Run:

```powershell
$secret = [System.Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
$access = [System.Convert]::ToBase64String((1..18 | ForEach-Object { Get-Random -Maximum 256 }))
ssh ubuntu@82.157.202.171 "mkdir -p /home/ubuntu/apps/super-video-resolver"
ssh ubuntu@82.157.202.171 "cat > /home/ubuntu/apps/super-video-resolver/.env.production <<'EOF'
APP_BASE_URL=http://82.157.202.171:3000
ACCESS_CODE=$access
AUTH_SECRET=$secret
YT_DLP_BIN=/home/ubuntu/.local/bin/yt-dlp
RESOLVE_TIMEOUT_MS=25000
NEXT_PUBLIC_APP_NAME=Super Video Resolver
EOF
chmod 600 /home/ubuntu/apps/super-video-resolver/.env.production"
```

Expected: env file exists on server and is readable only by `ubuntu`.

- [ ] **Step 4: Deploy**

Run:

```powershell
scp deploy/deploy.sh ubuntu@82.157.202.171:/tmp/deploy-super-video-resolver.sh
ssh ubuntu@82.157.202.171 "bash /tmp/deploy-super-video-resolver.sh"
```

Expected: systemd service is active.

- [ ] **Step 5: Smoke test locally from server**

Run:

```powershell
ssh ubuntu@82.157.202.171 "curl -I http://127.0.0.1:3000"
```

Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 6: Smoke test public endpoint**

Run:

```powershell
curl -I http://82.157.202.171:3000
```

Expected: `HTTP/1.1 200 OK`. If this fails but server-local curl works, the Tencent/cloud security group must allow inbound TCP `3000`.

---

### Task 12: Final Verification And Handoff

**Files:**

- Modify: `outputs/2026-07-03-super-video-resolver-deployment.md`

- [ ] **Step 1: Run local verification**

Run:

```powershell
npm test
npm typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 2: Run server verification**

Run:

```powershell
ssh ubuntu@82.157.202.171 "systemctl is-active super-video-resolver && journalctl -u super-video-resolver -n 40 --no-pager"
curl -I http://82.157.202.171:3000
```

Expected: service is `active`, recent logs have no startup errors, public endpoint returns 200.

- [ ] **Step 3: Write deployment note**

Create `outputs/2026-07-03-super-video-resolver-deployment.md`:

```markdown
# Super Video Resolver Deployment

- GitHub: https://github.com/Mitsukikis/super-video-resolver
- Public test URL: http://82.157.202.171:3000
- Server app directory: /home/ubuntu/apps/super-video-resolver
- Service: super-video-resolver
- Restart: sudo systemctl restart super-video-resolver
- Logs: journalctl -u super-video-resolver -f

The app does not proxy or store video files. Temporary cookies are accepted only for logged-in resolve requests and are not persisted.
```

- [ ] **Step 4: Commit final docs**

```powershell
git add outputs/2026-07-03-super-video-resolver-deployment.md
git commit -m "docs: add deployment handoff"
git push
```

---

## Self-Review

Spec coverage:

- Plugin architecture: Tasks 2, 4, and 5.
- No server video proxying: Tasks 4 and 5 use yt-dlp metadata extraction only; no server download endpoint exists.
- Temporary cookies: Tasks 5 and 6 gate cookies behind login and keep them request-scoped.
- Browser merge: Task 8.
- Local fallbacks: Tasks 4 and 7.
- Rate limits and safety: Task 3 and Task 5.
- GitHub and server deployment: Tasks 10 and 11.
- Public test URL: Task 11 and Task 12.

Placeholder scan:

- No TBD/TODO placeholders.
- Future platform list is explicitly excluded from MVP scope.

Type consistency:

- `Manifest`, `Track`, `Variant`, `Fallback`, `Platform`, `ResolverPlugin`, and `ResolveInput` are introduced before later tasks use them.
- The API route consumes `createResolveService`, which is defined in Task 5.
- UI consumes `Manifest`, which is defined in Task 2.
