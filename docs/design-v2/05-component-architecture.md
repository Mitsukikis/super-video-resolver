# 05 Component Architecture

## Current Components

Existing components:

- `CapabilityStrip`
- `DownloadPanel`
- `LoginPanel`
- `ParticleField`
- `ResolverForm`
- `ResultView`

## Preserve, Split, Merge, Or Replace

| Component | V2 decision | Reason |
| --- | --- | --- |
| `ParticleField` | Keep, tone down | It supports atmosphere and reduced motion, but should not dominate. |
| `LoginPanel` | Split | Access code logic stays, but UI should become `AccessGate` and `AuthStatus`. |
| `ResolverForm` | Split | It currently owns URL, Cookie, resolve state, fetch, errors, and result mounting. V2 needs smaller units. |
| `ResultView` | Split | Manifest display, resource table, tabs, and selection need independent structure. |
| `DownloadPanel` | Split | Direct link, browser merge, fallback commands, and task progress need clearer states. |
| `CapabilityStrip` | Replace/repurpose | Static claims should become data-driven capability/status badges. |

## Proposed V2 Component Tree

```text
HomePage (server)
├─ ParticleField
├─ AppShell
│  ├─ TopNav
│  │  ├─ BrandMark
│  │  ├─ SafetyBadges
│  │  └─ AuthStatus / AccessGateTrigger
│  ├─ ResolverWorkspace (client)
│  │  ├─ PlatformRail
│  │  │  └─ PlatformNavItem
│  │  ├─ CommandCenter
│  │  │  ├─ ProductPromise
│  │  │  ├─ UrlInputBar
│  │  │  ├─ CookieInputPanel
│  │  │  └─ ResolveActions
│  │  ├─ PlatformInspector
│  │  │  ├─ PlatformRequirements
│  │  │  ├─ CookieHelp
│  │  │  └─ PrivacyMini
│  │  ├─ ResolveStatusPanel
│  │  └─ ResultWorkspace
│  │     ├─ ManifestSummary
│  │     ├─ WarningStrip
│  │     ├─ ResourceTabs
│  │     ├─ TrackTable / TrackCards
│  │     ├─ VariantSelector
│  │     └─ DownloadTaskPanel
│  │        ├─ DirectDownloadAction
│  │        ├─ BrowserMergeTask
│  │        └─ LocalCommandPanel
│  ├─ SupportedPlatformsSection
│  ├─ PrivacyExplainerSection
│  ├─ FAQSection
│  └─ SiteFooter
```

## Business Components

These own state or call APIs:

- `ResolverWorkspace`
  - Owns URL, temporary Cookie, selected platform, resolve state, selected variant, and current task.
  - Calls `/api/resolve`.

- `AccessGate`
  - Calls `/api/login` and `/api/logout`.
  - Receives initial `loggedIn` from `HomePage`.

- `BrowserMergeTask`
  - Calls `checkBrowserMerge` and `mergeTracksWithFfmpeg`.
  - Owns merge progress, error, completion, and cancellation state.

- `DownloadTaskPanel`
  - Owns action state for direct download, browser merge, local command copy, and completion.

## Pure Display Components

These should be prop-driven and reusable:

- `TopNav`
- `SafetyBadges`
- `PlatformRail`
- `PlatformNavItem`
- `ProductPromise`
- `PlatformRequirements`
- `PrivacyMini`
- `ResolveStatusPanel`
- `ManifestSummary`
- `WarningStrip`
- `ResourceTabs`
- `TrackTable`
- `TrackCards`
- `VariantSelector`
- `SupportedPlatformsSection`
- `PrivacyExplainerSection`
- `FAQSection`
- `SiteFooter`

## Shared Data Types

Do not change backend schemas for V2 design.

Use current types:

- `Manifest`
- `Track`
- `Variant`
- `Fallback`
- `Platform`

Add frontend-only UI types during implementation:

```ts
type UiPlatformStatus = "supported" | "limited" | "planned";

type ResolveUiState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "loading"; step: ResolveStep }
  | { status: "success"; manifest: Manifest }
  | { status: "partial-success"; manifest: Manifest; warnings: string[] }
  | { status: "error"; kind: ResolveErrorKind; message: string };

type ResolveErrorKind =
  | "invalid-url"
  | "unsupported-platform"
  | "cookie-missing"
  | "cookie-invalid"
  | "login-inaccessible"
  | "timeout"
  | "rate-limited"
  | "policy-blocked"
  | "unknown";

type DownloadTaskState =
  | { status: "idle" }
  | { status: "downloading" }
  | { status: "merging"; progressLabel: string; progress?: number }
  | { status: "complete"; message: string }
  | { status: "cancelled" }
  | { status: "error"; message: string };
```

These are UI adapters only; they should map from current API responses.

## Reusable Components For Future Pages

- `TopNav`
- `SafetyBadges`
- `PlatformRail`
- `StatusBadge`
- `TaskProgress`
- `ResourceTabs`
- `TrackTable`
- `LocalCommandPanel`
- `FAQSection`

## Files Likely Involved During Implementation

Existing files:

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/ParticleField.tsx`
- `src/components/LoginPanel.tsx`
- `src/components/ResolverForm.tsx`
- `src/components/ResultView.tsx`
- `src/components/DownloadPanel.tsx`
- `src/components/CapabilityStrip.tsx`
- `src/lib/client/browserMerge.ts`
- `src/lib/client/particleConfig.ts`

Likely new files:

- `src/components/AppShell.tsx`
- `src/components/TopNav.tsx`
- `src/components/ResolverWorkspace.tsx`
- `src/components/PlatformRail.tsx`
- `src/components/CommandCenter.tsx`
- `src/components/CookieInputPanel.tsx`
- `src/components/ResolveStatusPanel.tsx`
- `src/components/ResultWorkspace.tsx`
- `src/components/TrackTable.tsx`
- `src/components/DownloadTaskPanel.tsx`
- `src/components/SupportSections.tsx`
- `src/lib/client/resolveUiState.ts`
- `src/lib/client/platformUi.ts`

## No Tech Stack Change

Next.js, React, TypeScript, Zod, Vitest, and `@ffmpeg/ffmpeg` are sufficient for V2. A state library is not needed. A visual icon library can be considered only if the implementation phase explicitly approves adding a dependency.

