# Comparison Modes

ChronoMEL offers two ways to look at orthophoto history, toggled via the
top-right button (or the `M` keyboard shortcut): **timeline** (frise
chronologique) and **compare** (comparateur). Both are orchestrated by
`initChrono()` in `src/chrono.js`.

## Timeline mode

One orthophoto WMS layer is shown at a time. A year slider
(`src/timeline-control.js`) picks the **principal** millésime for a
year; if that year also has variants (infrared, stereoscopic…), pills
appear below the slider to switch between them without changing years.
See [Configure the Timeline](../how-to/configure-timeline.md) for how the
year range and available millésimes are defined.

## Compare mode

Two orthophoto layers are shown simultaneously, split by a draggable
vertical curtain (`SwipeCurtain`, `src/swipe-control.js`) — a small,
dependency-free control built specifically for this project (not a
leaflet-atlas or third-party plugin). Two dropdowns
(`src/compare-control.js`) pick the left and right millésimes
independently, from the full list including variants.

### How the curtain works

`SwipeCurtain` doesn't reproject or crop the actual map layers — it uses
the CSS [`clip`](https://developer.mozilla.org/en-US/docs/Web/CSS/clip)
property on each layer's DOM container, computed from the divider's
position on every map `move` event:

```javascript
const leftRect = `rect(${nw.y}px, ${clipX}px, ${se.y}px, ${nw.x}px)`;
const rightRect = `rect(${nw.y}px, ${se.x}px, ${se.y}px, ${clipX}px)`;
```

Both layers stay fully loaded and positioned; only their visible
rectangle changes. This keeps panning/zooming perfectly in sync between
the two — there's no coordinate translation to get subtly wrong, unlike
side-by-side or overlay-diff approaches.

## Shared state, mode-specific layers

Both modes share one `state` object in `initChrono()`
(`{ mode, currentId, leftId, rightId }`), persisted to `localStorage`
under the `chronomel:etat` key so a returning visitor sees the same
mode and millésimes. Switching modes doesn't reset the other mode's
selection — going from compare back to timeline keeps `leftId`/`rightId`
intact for next time.

WMS layers are cached per millésime `id` (`layerFor()` in
`src/chrono.js`) and instantiated lazily: switching modes or millésimes
reuses an already-created `L.tileLayer.wms` instance instead of
recreating it, and a layer is only removed from the map when neither
side of the comparator nor the timeline still references it.

## What follows the mode/year

The bâti remarquable layer (if enabled) restyles itself whenever the
mode or year changes, via `syncBati()` — see
[Temporal Data Handling](temporal-data-handling.md) for what that
restyling represents and why compare mode uses the **left** side's year.

---

See also:

- [Temporal Data Handling](temporal-data-handling.md) — what "present" vs.
  "projected" means for the bâti layer
- [Configure the Timeline](../how-to/configure-timeline.md)
