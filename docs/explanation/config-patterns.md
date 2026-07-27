# Configuration Patterns

`src/config.ts` wires ChronoMEL's data into
[leaflet-atlas](https://github.com/rlespinasse/leaflet-atlas). This
document explains the recurring patterns in that file — the "why", not
the field-by-field schema (see the
[Configuration API reference](../reference/config-api.md) for that).

## `layerGroups` vs. `contextLayers`

Both accept the same layer shape (`id`, `label`, `file`, `active`), but
leaflet-atlas renders them in different UI sections:

- **`layerGroups`** — layers meant to be toggled and explored (grouped
  under a named section, "Repères" here)
- **`contextLayers`** — layers meant to stay in the background as
  permanent reference (rendered in a dedicated "Contexte" section)

ChronoMEL puts every context layer (transport, hydrographie,
végétation) in `contextLayers` **and only there** — declaring the same
layer in both would render two sections for it (one empty, one full).
The rule of thumb used here: if a layer can react to the selected
millésime (see [Temporal Data Handling](temporal-data-handling.md)), it
belongs in `layerGroups`; if it's a static geographic backdrop, it
belongs in `contextLayers`.

## `geometryTypes` is not optional

Every layer id appears in `geometryTypes`, even though nothing forces
this at the type level. Without it, leaflet-atlas assumes every layer is
a polygon and computes its z-order (which pane it renders in) from
feature area — which only makes sense for polygons. A pure point/line
layer left out of `geometryTypes` falls into the default overlayPane
(z-index 400), *under* polygon layers such as `communes` (whose fill is
invisible but still clickable) — so its features become unclickable.
Declaring the type correctly stacks points above lines above polygons,
matching the intuitive "smaller/more precise things should be
clickable first" expectation. See the comment above `geometryTypes` in
`src/config.ts` for the full reasoning, and why hydrographie is split
into two layers (`hydroCours` as lines, `hydroSurfaces` as polygons)
rather than one — a single filled style would visually close open
watercourses into a false polygon.

## `escapeHtml` in every `detailBuilders` entry

`detailBuilders` returns raw HTML strings that leaflet-atlas injects
into the detail panel. Every field pulled from GeoJSON `properties`
(commune names, dataset labels…) is untrusted external data — it goes
through the local `escapeHtml()` helper before interpolation. This is
the project's only defense against a malicious or malformed upstream
dataset injecting markup into the detail panel; skipping it for a new
layer would reopen that gap.

## `detailBuilders` is a function, not an object

```typescript
detailBuilders: () => ({
  communes: (p) => `...`,
}),
```

leaflet-atlas expects `detailBuilders` to be a zero-argument function
returning the per-layer builder map, not the map directly — this defers
evaluation until the map (and its dependent closures, like
`getMillesimeAffiche()` for the `bati` entry) is actually ready.

## `onReady` as the extension point

`config.ts` only declares *static* structure — layers, styles,
tooltips. Everything dynamic (WMS orthophoto layers, the timeline,
the comparator, keyboard shortcuts) is deliberately kept out of
`config.ts` and instead wired through the single `onReady` hook:

```typescript
onReady: (app) => initChrono(app),
```

`initChrono()` (`src/chrono.js`) receives the fully-initialized
`MapApp` instance and layers ChronoMEL's own behavior on top. This
separation means `config.ts` stays a declarative, mostly-JSON-shaped
file that `scripts/validate-config.mjs` can pattern-match against,
while `chrono.js` holds all imperative logic.

## Shared analytics config, two emitters

`analyticsConfig` (`src/analytics.js`) is passed to leaflet-atlas via
`config.analytics` *and* reused directly by `trackEvent()`, which
ChronoMEL's own controls (mode toggle, millésime selection, comparator)
call explicitly. Both emitters share the same `basePath: '/chronomel/'`
prefix so events from native leaflet-atlas UI and from ChronoMEL-specific
controls land in the same GoatCounter namespace. See
`src/analytics.js` for why localhost hits are excluded.

## A stray duplicate: `atlas-config.js`

`src/atlas-config.js` is a near-identical, plain-JavaScript copy of
`config.ts` — but nothing imports it (`main.js` imports `./config.js`,
which resolves to `config.ts`). It appears to be a leftover from the
TypeScript migration. Treat `config.ts` as the only source of truth;
don't edit `atlas-config.js` expecting it to take effect.

---

See also:

- [Configuration API reference](../reference/config-api.md) — full field
  schema
- [Temporal Data Handling](temporal-data-handling.md)
