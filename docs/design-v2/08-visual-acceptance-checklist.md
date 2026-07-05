# 08 Visual Acceptance Checklist

Use this checklist before V2 implementation is accepted.

## Product And Trust

- The first viewport makes the main task obvious: paste link and resolve.
- The site does not imply server-side media downloading, caching, or proxying.
- Cookie copy says platform Cookie is temporary and not the site access code.
- Planned platforms are marked as planned/waiting, not as supported.
- DRM, paid content, and access-control bypass are not promised or encouraged.

## Layout

- Top navigation fits at 1440, 1024, 768, 390, and 360 widths.
- URL input and parse button appear in the first viewport.
- Platform selector remains visible and usable on mobile.
- Results become the main workspace after success.
- No decorative card is nested inside another decorative card.
- No important control is hidden behind only-hover interaction.

## Design System

- CSS uses V2 tokens for color, spacing, radius, shadow, and typography.
- Dominant palette is not only teal/purple glow.
- Semantic colors are used consistently for success/warning/error/info.
- Cards and controls use 8px radius unless specifically justified.
- Shadows and glow are restrained and state-driven.

## Typography

- Chinese and English text use the approved font stack.
- Heading sizes are reserved for true headings.
- Labels, captions, helper text, and code use distinct sizes.
- Long URLs and commands do not break layout.
- Text contrast remains readable over any background effect.

## Interaction States

- Initial empty state is useful.
- Loading state shows progress steps.
- Success state shows summary, tracks, variants, and actions.
- Partial success shows warnings without blocking available resources.
- Invalid URL, unsupported platform, Cookie missing, Cookie invalid, private/login-inaccessible, timeout, and rate-limit errors all have next actions.
- Downloading, merging, complete, cancelled, and failed task states are represented.

## Responsive

- 1440x1100 desktop screenshot passes.
- 1024x1000 laptop screenshot passes.
- 768x1100 tablet screenshot passes.
- 390x1200 mobile screenshot passes.
- 360x1200 narrow mobile screenshot passes.
- No horizontal page overflow at mobile widths.

## Motion And Background

- Particle count and opacity are subtle.
- Reduced motion disables nonessential animation.
- Hover and focus states do not move layout.
- Background effects never cover input, Cookie field, result table, or commands.

## Accessibility

- Focus ring is visible on inputs, buttons, tabs, platform items, and details.
- Interactive controls have text labels or accessible labels.
- Color is not the only indicator of error/warning/success.
- Native form semantics are preserved.

## Engineering

- No backend API contract changes unless separately approved.
- `Manifest`, `Track`, `Variant`, and `Fallback` remain compatible.
- No new platform support is shown as live without resolver support.
- `npm run typecheck` passes.
- `npm test` passes.
- `npm run build` passes.
- Git diff contains only planned files for the phase.

