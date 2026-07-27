# How to Customize Styling

There are two independent styling layers in ChronoMEL: **layer styling**
(colors/opacity of GeoJSON features on the map) and **UI chrome styling**
(the timeline, comparator, and mode-toggle panels). This guide covers the
second one — for layer styling, see [Add a Layer](add-layer.md#5-add-styling)
and the [Configuration API reference](../reference/config-api.md#styles).

## UI Chrome: CSS Custom Properties

The floating panels (`chrono-panel` and its variants) are themed through
four CSS custom properties defined in `src/css/app.css`:

```css
:root {
  --chrono-bg: rgba(20, 24, 31, 0.88);
  --chrono-fg: #f4f6f8;
  --chrono-accent: #4ea1ff;
  --chrono-muted: #aab4c0;
}
```

| Variable          | Used for                                                |
| ----------------- | ------------------------------------------------------- |
| `--chrono-bg`     | Panel background (timeline, comparator, mode toggle)    |
| `--chrono-fg`     | Panel text color                                        |
| `--chrono-accent` | Active slider thumb, active chip/tab, swipe handle ring |
| `--chrono-muted`  | Secondary text (kicker labels, detail captions)         |

To re-theme the UI, override these in `src/css/app.css` — every panel
picks them up automatically, no JS changes required:

```css
:root {
  --chrono-bg: rgba(255, 255, 255, 0.9);
  --chrono-fg: #14181f;
  --chrono-accent: #d94f4f;
  --chrono-muted: #6b7280;
}
```

## Panel-Specific Classes

Beyond the shared variables, each control has its own classes if you need
finer control:

- `.chrono-timeline`, `.chrono-compare` — panel width (`min(420px, 80vw)`)
- `.chrono-slider` — the year range input; `accent-color` follows
  `--chrono-accent`
- `.chrono-chip` / `.chrono-chip.is-active` — variant pills (IRC,
  stéréoscopique…) in the timeline panel
- `.chrono-mode` / `.chrono-mode.is-active` — the "Frise chronologique" /
  "Comparer" toggle buttons
- `.swipe-divider`, `.swipe-range` — the compare-mode curtain handle; the
  handle icon is an inline SVG data URI (`::-webkit-slider-thumb` /
  `::-moz-range-thumb`) so it can't be restyled with a simple color
  override — edit the SVG in `app.css` directly if you need a different
  handle icon

## Detail Panel (feature click)

The `<dl class="commune-detail">` markup used across all `detailBuilders`
in `src/config.ts` is a simple two-column grid (`dt`/`dd`) styled in
`app.css` under `.commune-detail`. Reuse this class for any new layer's
detail HTML to stay visually consistent — see the existing
`detailBuilders` entries for the markup pattern.

## Testing changes

```bash
npm run dev
```

CSS changes hot-reload instantly. Toggle both modes (`m` key) and open a
feature's detail panel to check all the affected surfaces.

---

See also:

- [Configuration API: styles](../reference/config-api.md#styles) — per-layer
  GeoJSON styling (color, weight, fill)
- [Comparison Modes](../explanation/comparison-modes.md) — how the swipe
  curtain and mode toggle work
