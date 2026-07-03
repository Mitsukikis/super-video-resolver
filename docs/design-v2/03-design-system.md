# 03 Design System

## Design Direction

V2 should be a restrained dark utility workspace. The visual character is precise, calm, and technical, but not over-glowing or decorative. Effects should help users understand state, not compete with the input form.

## Color Tokens

Use these as CSS custom properties during implementation.

```css
:root {
  color-scheme: dark;

  --color-bg: #07090f;
  --color-bg-grid: rgba(148, 163, 184, 0.055);
  --color-bg-radial-a: rgba(34, 211, 238, 0.08);
  --color-bg-radial-b: rgba(139, 92, 246, 0.06);

  --color-surface-0: #0b1018;
  --color-surface-1: #0f1724;
  --color-surface-2: #141e2e;
  --color-surface-raised: rgba(15, 23, 36, 0.94);
  --color-surface-muted: rgba(30, 41, 59, 0.48);

  --color-border-subtle: rgba(148, 163, 184, 0.16);
  --color-border: rgba(148, 163, 184, 0.26);
  --color-border-strong: rgba(203, 213, 225, 0.38);
  --color-border-focus: rgba(34, 211, 238, 0.58);

  --color-text: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #94a3b8;
  --color-text-disabled: #64748b;
  --color-text-inverse: #061018;

  --color-accent: #22d3ee;
  --color-accent-strong: #67e8f9;
  --color-accent-soft: rgba(34, 211, 238, 0.12);
  --color-accent-alt: #8b5cf6;
  --color-accent-alt-soft: rgba(139, 92, 246, 0.12);

  --color-success: #22c55e;
  --color-success-soft: rgba(34, 197, 94, 0.12);
  --color-warning: #f59e0b;
  --color-warning-soft: rgba(245, 158, 11, 0.13);
  --color-danger: #f43f5e;
  --color-danger-soft: rgba(244, 63, 94, 0.13);
  --color-info: #60a5fa;
  --color-info-soft: rgba(96, 165, 250, 0.13);
}
```

## Color Usage Rules

- Use `--color-accent` for primary action, active platform, and focus.
- Use `--color-accent-alt` sparingly for secondary highlights or browser merge.
- Use semantic colors only for status and alerts.
- Do not put glow on every card. Glow is allowed only on focus, active platform, active task, and primary CTA hover.
- Background particles must remain below 12% perceived opacity.
- Avoid large purple/blue gradients dominating the full page.

## Typography

### Font Stacks

```css
--font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei",
  "Noto Sans CJK SC", "Noto Sans SC", Arial, sans-serif;

--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
```

Do not fetch external fonts in Phase 1 unless explicitly approved.

### Type Scale

| Token | Size | Line Height | Weight | Use |
| --- | ---: | ---: | ---: | --- |
| `--text-display` | 40px | 48px | 800 | First viewport title only |
| `--text-h1-mobile` | 30px | 38px | 800 | Mobile first title |
| `--text-title` | 24px | 32px | 750 | Section titles |
| `--text-subtitle` | 18px | 26px | 700 | Panel headings |
| `--text-body` | 15px | 24px | 500 | Main copy |
| `--text-body-strong` | 15px | 24px | 700 | Important inline labels |
| `--text-label` | 13px | 18px | 750 | Field labels |
| `--text-caption` | 12px | 16px | 650 | Badges, metadata |
| `--text-code` | 12px | 18px | 500 | Command/code blocks |

Rules:

- Letter spacing stays `0`.
- Use uppercase sparingly; Chinese labels should not be forced uppercase.
- Long URLs and commands need `overflow-wrap: anywhere` or horizontal scrolling in code blocks.

## Spacing Scale

Use a 4px base:

| Token | Value |
| --- | ---: |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

Tool panels should generally use 16px or 20px padding. Marketing-style vertical gaps above 64px should be avoided in the main workflow.

## Radius Tokens

| Token | Value | Use |
| --- | ---: | --- |
| `--radius-xs` | 4px | code chips, status dots |
| `--radius-sm` | 6px | small buttons, small tags |
| `--radius-md` | 8px | cards, panels, inputs, buttons |
| `--radius-lg` | 12px | only large workspace container if needed |
| `--radius-pill` | 999px | compact status badges only |

Cards and primary panels should stay at 8px unless a large workspace shell needs 12px.

## Borders, Shadows, Glow

```css
--shadow-panel: 0 16px 48px rgba(0, 0, 0, 0.28);
--shadow-elevated: 0 24px 70px rgba(0, 0, 0, 0.36);
--shadow-focus: 0 0 0 3px rgba(34, 211, 238, 0.16);
--glow-active: 0 0 0 1px rgba(34, 211, 238, 0.32), 0 0 28px rgba(34, 211, 238, 0.10);
```

Rules:

- Default panels: border only, no glow.
- Main workspace: one elevated shadow.
- Active platform/active task: one subtle glow.
- Error and warning states: colored border left or icon, not full-panel neon glow.

## Layout And Grid

```css
--page-max: 1440px;
--workspace-max: 1320px;
--sidebar-width: 236px;
--inspector-width: 320px;
--topbar-height: 64px;
```

Desktop grid:

```text
minmax(220px, 236px) minmax(0, 1fr) minmax(280px, 320px)
```

When results are present, the right inspector can collapse below or become a details drawer so the resource table has room.

## Breakpoints

| Token | Width | Behavior |
| --- | ---: | --- |
| `--bp-desktop` | 1200px+ | sidebar + main + inspector |
| `--bp-laptop` | 960-1199px | sidebar + main, inspector below |
| `--bp-tablet` | 720-959px | horizontal platform tabs, single main column |
| `--bp-mobile` | <=719px | top nav wraps, platform selector becomes segmented control, all panels single column |

## Motion Tokens

```css
--duration-fast: 120ms;
--duration-base: 180ms;
--duration-slow: 260ms;
--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
```

Rules:

- Inputs, tabs, and button hover use 120-180ms.
- Panel reveal/drawer transitions use 180-260ms.
- No layout-shifting hover transforms on dense tool surfaces.
- Under `prefers-reduced-motion: reduce`, disable scanline, particle movement, smooth scrolling, and nonessential transitions.

## Icon Style

- 18px for inline labels, 20px for buttons, 24px for empty states.
- Rounded stroke, 1.75px stroke width.
- Icons must support scanning: paste/link, cookie/key, shield/privacy, server, browser, download, merge, warning, retry.
- No icon dependency is required in design stage. If implementation approves a new dependency, `lucide-react` is the preferred style; otherwise use text labels and minimal CSS status symbols.

## State Visual Rules

- **Empty**: muted panel, dashed drop zone only if paste/drop is implemented.
- **Loading**: progress rail and step labels, no blocking full-page overlay.
- **Success**: green status chip plus resource table; avoid full green panels.
- **Partial success**: amber warning strip above resources, keep usable actions visible.
- **Error**: red left border, plain-language cause, next-action buttons.
- **Disabled**: lower text contrast, no glow, cursor state accurate.

