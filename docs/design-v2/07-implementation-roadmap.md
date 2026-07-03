# 07 Implementation Roadmap

This roadmap intentionally avoids a one-shot frontend rewrite. Each phase should be independently reviewable and reversible.

## Phase 0: Preparation, Branch, Baseline Screenshots

- **Modify scope**: no product code. Create branch, capture screenshots, record current behavior.
- **Files involved**: none required; optional `docs/design-v2/baseline-notes.md`.
- **Do not modify**: `src/`, API routes, resolver logic, environment variables.
- **Completion standard**: baseline screenshots captured for 1440, 1024, 768, 390, and one error state.
- **Test method**: `npm run typecheck`, `npm test`, `npm run build` if current baseline needs confirmation.
- **Screenshot sizes**: 1440x1100, 1024x1000, 768x1100, 390x1200.
- **Rollback**: delete baseline notes/screenshots or switch branch.

## Phase 1: Design Tokens, Global Styles, Base Components

- **Modify scope**: CSS variables, typography, base button/input/status styles, reduced glow rules.
- **Files involved**:
  - `src/app/globals.css`
  - optional new `src/components/ui/StatusBadge.tsx`
  - optional new `src/components/ui/TaskProgress.tsx`
- **Do not modify**: `/api/*`, `src/lib/resolvers/*`, `ManifestSchema`.
- **Completion standard**: V1 page still works but uses V2 tokens; no layout rewrite yet.
- **Test method**: `npm run typecheck`, `npm test`, `npm run build`; screenshot initial page.
- **Screenshot sizes**: 1440x1100, 390x1200.
- **Rollback**: revert `globals.css` and new base UI files.

## Phase 2: Navigation, First Viewport, Resolver Input Workspace

- **Modify scope**: top nav, platform rail/tabs, compact intro, URL input, Cookie panel placement.
- **Files involved**:
  - `src/app/page.tsx`
  - `src/components/TopNav.tsx`
  - `src/components/ResolverWorkspace.tsx`
  - `src/components/PlatformRail.tsx`
  - `src/components/CommandCenter.tsx`
  - `src/components/CookieInputPanel.tsx`
  - existing `LoginPanel.tsx` and `ResolverForm.tsx` may be split.
- **Do not modify**: backend API contracts, `ytDlp.ts`, `resolveService.ts`.
- **Completion standard**: user can paste URL, optionally Cookie, resolve exactly as before; supported/planned platforms are accurately labeled.
- **Test method**: `npm run typecheck`, `npm test`, manual resolve smoke test if server/tools are available.
- **Screenshot sizes**: 1440x1100, 1024x1000, 768x1100, 390x1200.
- **Rollback**: revert workspace component changes while keeping Phase 1 tokens if stable.

## Phase 3: Resolve States And Result Resource List

- **Modify scope**: loading/progress UI, error mapping, result summary, resource tabs, track table/cards.
- **Files involved**:
  - `src/components/ResolveStatusPanel.tsx`
  - `src/components/ResultWorkspace.tsx`
  - `src/components/ManifestSummary.tsx`
  - `src/components/TrackTable.tsx`
  - `src/components/ResourceTabs.tsx`
  - `src/lib/client/resolveUiState.ts`
  - existing `ResultView.tsx` split or replaced.
- **Do not modify**: `ManifestSchema`, `/api/resolve`, resolver plugins.
- **Completion standard**: all existing manifest fixtures can render; errors show next actions; previous input remains after errors.
- **Test method**: add/adjust component tests if practical; run `npm run typecheck`, `npm test`, `npm run build`.
- **Screenshot sizes**: success at 1440, success at 390, error at 1440, unsupported platform at 390.
- **Rollback**: revert result components and keep resolver input intact.

## Phase 4: Download, Local Merge, Task State

- **Modify scope**: split direct download, browser merge progress, local command copy, cancel/complete states.
- **Files involved**:
  - `src/components/DownloadTaskPanel.tsx`
  - `src/components/BrowserMergeTask.tsx`
  - `src/components/LocalCommandPanel.tsx`
  - existing `DownloadPanel.tsx`
  - `src/lib/client/browserMerge.ts` only for UI-safe progress/cancel wrappers if needed.
- **Do not modify**: server download/proxy behavior; do not add server-side media handling.
- **Completion standard**: direct links still open source URLs; browser merge still uses client device; fallback commands remain copyable and sensitive warnings remain visible.
- **Test method**: `npm run typecheck`, `npm test`, build; manual CORS failure path if available.
- **Screenshot sizes**: merge progress 1440, merge error 390, command panel 390.
- **Rollback**: revert download task components to existing `DownloadPanel`.

## Phase 5: Supported Platforms, Privacy, FAQ

- **Modify scope**: below-workspace informational sections.
- **Files involved**:
  - `src/components/SupportedPlatformsSection.tsx`
  - `src/components/PrivacyExplainerSection.tsx`
  - `src/components/FAQSection.tsx`
  - `src/components/SiteFooter.tsx`
  - optional `src/lib/client/platformUi.ts`
- **Do not modify**: platform resolver support. Planned platforms remain non-clickable or clearly "待接入".
- **Completion standard**: live/planned support is accurate; privacy explanation matches README and code.
- **Test method**: typecheck/build; visual screenshots.
- **Screenshot sizes**: 1440 full page, 390 full page.
- **Rollback**: remove informational sections.

## Phase 6: Mobile Adaptation

- **Modify scope**: responsive CSS, mobile platform selector, track cards, touch targets.
- **Files involved**:
  - `src/app/globals.css`
  - components from Phases 2-5 as needed.
- **Do not modify**: backend, data contracts, core resolve behavior.
- **Completion standard**: no horizontal overflow at 360px; primary action visible; result cards readable; command blocks scroll safely.
- **Test method**: visual screenshots, browser responsive mode, `npm run build`.
- **Screenshot sizes**: 768x1100, 390x1200, 360x1200.
- **Rollback**: revert responsive CSS changes.

## Phase 7: Visual QA, Accessibility, Performance

- **Modify scope**: fixes only after QA findings.
- **Files involved**: depends on findings.
- **Do not modify**: feature scope or backend behavior.
- **Completion standard**:
  - typecheck/test/build pass
  - desktop/mobile screenshots accepted
  - reduced motion verified
  - text contrast and focus states acceptable
  - particle/canvas does not dominate
- **Test method**:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - visual screenshots at required sizes
- **Screenshot sizes**: all required state screenshots.
- **Rollback**: revert only QA fix commits or reset to previous phase branch point.

