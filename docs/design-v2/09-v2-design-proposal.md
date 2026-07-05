# 09 V2 Design Proposal

This is the single primary input for the later implementation mode.

## Confirmed Skill And Mode

- Skill: `premium-web-dna-workflow`
- Mode: Design
- Boundary: planning documents only; no product code, dependencies, backend interfaces, deployment, or implementation commits.

## V2 Strategy

Build V2 as a platform-aware resolver workspace.

The first screen combines compact positioning with the actual workbench. The product promise stays visible, but the URL input, platform selection, Cookie handling, progress, and result handoff become the primary interface.

## Final Page Structure

```text
TopNav
├─ Brand
├─ Safety badges
└─ Auth status

ResolverWorkspace
├─ PlatformRail / PlatformTabs
├─ CommandCenter
│  ├─ ProductPromise
│  ├─ UrlInputBar
│  ├─ CookieInputPanel
│  └─ ResolveActions
├─ PlatformInspector
├─ ResolveStatusPanel
└─ ResultWorkspace
   ├─ ManifestSummary
   ├─ WarningStrip
   ├─ ResourceTabs
   ├─ TrackTable / TrackCards
   ├─ VariantSelector
   └─ DownloadTaskPanel
      ├─ DirectDownloadAction
      ├─ BrowserMergeTask
      └─ LocalCommandPanel

SupportedPlatformsSection
PrivacyExplainerSection
FAQSection
SiteFooter
```

## Product Rules

- Server never proxies, stores, downloads, or merges media files.
- Temporary platform Cookie is only used for the current resolve request.
- Site access code only unlocks site functionality; it does not log into video platforms.
- Live supported platforms remain YouTube, Bilibili, and X / Twitter.
- Douyin, Xiaohongshu, and Weibo can be displayed only as planned/waiting until real resolvers exist.
- Do not promise DRM, private, paid, member-only, or access-control bypass.

## Design System Summary

- Background: `#07090f`
- Main surface: `#0f1724`
- Raised surface: `rgba(15, 23, 36, 0.94)`
- Border: `rgba(148, 163, 184, 0.26)`
- Primary accent: `#22d3ee`
- Secondary accent: `#8b5cf6`
- Success: `#22c55e`
- Warning: `#f59e0b`
- Error: `#f43f5e`
- Text: `#f8fafc`, `#cbd5e1`, `#94a3b8`, `#64748b`
- Font: Inter/system UI plus Chinese system stack.
- Spacing: 4px base scale.
- Radius: 8px default for panels, inputs, buttons.
- Motion: 120/180/260ms, reduced-motion safe.
- Effects: one active glow at a time; no all-page glass-card glow treatment.

## State Coverage

Implementation must cover:

1. Initial empty
2. Resolving
3. Success
4. Partial success
5. Link format error
6. Unsupported platform
7. Cookie missing
8. Cookie invalid
9. Login content inaccessible
10. Network timeout
11. Downloading
12. Browser local merging
13. Download complete
14. User cancelled task

All states keep previous input unless the user clears it.

## Component Plan

Keep and tone down:

- `ParticleField`

Split:

- `LoginPanel` -> `AccessGate`, `AuthStatus`
- `ResolverForm` -> `ResolverWorkspace`, `CommandCenter`, `CookieInputPanel`, `ResolveStatusPanel`
- `ResultView` -> `ManifestSummary`, `ResourceTabs`, `TrackTable`, `VariantSelector`
- `DownloadPanel` -> `DownloadTaskPanel`, `BrowserMergeTask`, `LocalCommandPanel`

Replace or repurpose:

- `CapabilityStrip` -> `SafetyBadges` and `SupportedPlatformsSection`

Use `useReducer` in `ResolverWorkspace`; do not add a state library.

## Implementation Order

Start with **Phase 0**, then **Phase 1**.

Phase 0 is highest priority because it captures the baseline and provides a rollback anchor before visual work. Phase 1 follows with tokens and base styles so later sections do not reinvent colors, radius, spacing, states, and focus behavior.

## Phase Summary

1. Phase 0: branch, baseline screenshots, current behavior notes.
2. Phase 1: tokens, typography, base surfaces, buttons, inputs, status components.
3. Phase 2: top nav, platform rail, compact first viewport, resolver command center.
4. Phase 3: resolve states and resource workspace.
5. Phase 4: download, browser merge, local command, task status.
6. Phase 5: supported platforms, privacy, FAQ, footer.
7. Phase 6: mobile adaptation.
8. Phase 7: visual QA, accessibility, performance.

## Decisions Needed Before Implementation

- Whether V2 should create a new branch immediately or continue on `main`.
- Whether to add an icon dependency such as `lucide-react` in implementation mode, or use no new dependency.
- Whether planned platforms should appear in the left rail from V2 launch or only in the supported-platform section.
- Whether access code controls should live in top nav, right inspector, or both.
- Whether browser merge cancel should be a real cancellation mechanism in Phase 4 or only a UI state for user-aborted workflow.
- Whether subtitle UI should be hidden until backend supports subtitle tracks, or shown as "待接口支持".

## Acceptance Gate For Implementation

Before considering V2 implemented:

- Typecheck, tests, and build pass.
- Required screenshots pass: 1440, 1024, 768, 390, 360 widths.
- Initial, loading, success, error, and merge progress states are visually verified.
- No backend API contract changes are introduced.
- No unsupported platform is presented as live.
- Privacy and no-server-download promises remain accurate.

