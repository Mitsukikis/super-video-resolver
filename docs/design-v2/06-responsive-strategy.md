# 06 Responsive Strategy

## Responsive Goals

- The URL input and primary parse button must be visible in the first viewport on every device.
- Platform selection must remain reachable without a hidden navigation puzzle.
- Results must remain readable even when tables collapse into cards.
- Background particles/media must never reduce readability.

## Breakpoints

| Name | Width | Layout |
| --- | ---: | --- |
| Desktop | >= 1200px | Three-column workspace: platform rail, command/results, inspector |
| Laptop | 960-1199px | Two-column workspace: platform rail, command/results; inspector below |
| Tablet | 720-959px | Single-column with horizontal platform tabs |
| Mobile | <= 719px | Single-column, compact top nav, segmented platform selector |

## Desktop Layout

```text
TopNav: 64px high
Workspace max width: 1320px

Grid:
236px platform rail
1fr command/results
320px inspector
```

Rules:

- First viewport target height: content fits within 760px where possible.
- Result table can use the full center column and push inspector below if needed.
- FAQ and privacy sections stay below the workflow.

## Laptop Layout

```text
Grid:
220px platform rail
1fr command/results
Inspector below center column
```

Rules:

- Platform rail remains vertical.
- Privacy mini and platform requirements can collapse into accordions.

## Tablet Layout

```text
TopNav wraps into two rows if needed.
PlatformRail becomes PlatformTabs.
CommandCenter and ResultWorkspace become one column.
```

Rules:

- URL input and parse button can stack only under 760px.
- Cookie panel should be collapsed by default unless logged in or error requires it.
- Resource tabs must be horizontally scrollable if needed.

## Mobile Layout

```text
TopNav:
brand + auth/status
secondary anchors collapse below

Workspace:
platform segmented selector
URL input
parse button full width
Cookie drawer
status/result cards
```

Rules:

- Main button full width.
- Track table becomes `TrackCards`.
- Long URLs and commands use horizontal scroll inside code blocks.
- Footer and FAQ should be simple accordions.
- Particle count is reduced and motion is disabled under reduced-motion.

## Screenshot Sizes For Implementation QA

Use these minimum screenshots:

- Desktop: 1440 x 1100
- Laptop: 1024 x 1000
- Tablet: 768 x 1100
- Mobile: 390 x 1200
- Narrow mobile: 360 x 1200

For result states, capture:

- Initial
- Loading
- Success with results
- Error
- Browser merge progress

## Text Fit Rules

- Button labels must fit at 360px width.
- Long platform names wrap before pushing controls.
- Resource quality labels should use compact forms: `1080p`, `60fps`, `mp4`, `HLS`.
- Code blocks use `overflow-x: auto`.
- URLs use `overflow-wrap: anywhere` in non-code summary text.

## Motion Responsiveness

- Desktop can use pointer-reactive particles at low opacity.
- Mobile should reduce particle count and link distance.
- Under `prefers-reduced-motion`, particle velocity becomes `0`, scanlines are disabled, and panel transitions become instant.

