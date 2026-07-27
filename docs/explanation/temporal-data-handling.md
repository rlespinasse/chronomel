# Temporal Data Handling

ChronoMEL shows how Lille's metropolitan area looked at a given point in
time. Not all layers can participate in that time travel the same way —
this document explains why, and how the ones that can are implemented.

## Two kinds of layers

**Temporal layers** carry a date the app can compare against the selected
millésime (year). Today there's exactly one: **bâti remarquable**
(`src/bati-remarquable.js`), sourced from BD TOPO®'s
`date_d_apparition` field.

**Context layers** (communes, transport, hydrographie, végétation,
équipements) don't carry an exploitable date in BD TOPO® — they're shown
as permanent reference features regardless of the selected year. This is
a data limitation, not a design choice: see the comment in
`scripts/refresh-equipements.mjs` for why équipements specifically can't
be dated.

## Present vs. projected — not present/past/future

For the bâti layer, `etatAuMillesime()` (`src/bati-remarquable.js`)
computes one of exactly two states for a given feature and displayed
year:

```javascript
export function etatAuMillesime(feature, annee) {
  return annee >= feature.properties.annee ? 'present' : 'projete';
}
```

- **`present`** — the year shown is at or after the building's
  `date_d_apparition`: it existed. Rendered as a solid, fully opaque
  marker.
- **`projete`** ("projected") — the year shown is before the building
  existed. Rendered as a faint, dashed-outline marker (`fillOpacity: 0`,
  `dashArray: '2,2'`) — a preview of what's coming, not a claim that it's
  currently visible.

There is deliberately **no `disparu` (demolished) state**: BD TOPO® does
not carry a demolition date, so ChronoMEL has no way to know if a
building present in 1930 is still standing today. Treating "no
demolition date" as "still exists" would silently misrepresent buildings
that were in fact torn down — the app only asserts what the data
actually supports.

## Where the year comes from

`getMillesimeAffiche()` / `setMillesimeAffiche()` in
`src/bati-remarquable.js` hold a single module-level variable: the year
currently displayed. It's set by `syncBati()` in `src/chrono.js`
whenever the timeline or comparator selection changes, and read by the
`bati` `detailBuilders` entry in `src/config.ts` — which otherwise only
receives a feature's `properties`, not the app's temporal state.

In **compare mode**, there are two years on screen at once (left/right).
`syncBati()` always uses the **left** side's year — chosen because the
left side is conventionally the older millésime, where the "projected"
state is the most informative to see. See
[Comparison Modes](comparison-modes.md) for how the two-sided layout
works.

## Orthophoto millésimes are not the same kind of "temporal"

The orthophoto WMS layers (`src/ortho-millesimes.js`) are the visual
backdrop that changes with the timeline, but they're not "temporal data"
in the sense above — they're an _index of available imagery years_, not
features with per-object dates. A millésime entry can be `principal`
(the one reference orthophoto for that year, shown on the main timeline)
or a variant of the same year (infrared, stereoscopic, without building
lean correction, alternate coverage perimeter) — see
`CATEGORIES` in `src/ortho-millesimes.js`. Only bâti remarquable reacts
to _which_ millésime is selected; the orthophoto itself is just swapped.

---

See also:

- [Comparison Modes](comparison-modes.md) — timeline vs. compare mode
- [Configuration API: geometryTypes](../reference/config-api.md#geometrytypes)
- [Configure the Timeline](../how-to/configure-timeline.md)
