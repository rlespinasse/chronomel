# Architecture: How ChronoMEL Works

ChronoMEL is a temporal geospatial viewer built on **leaflet-atlas**, a config-driven map framework.

## High-Level Overview

```
index.html
  ↓
src/main.js (entry point)
  ├─ Imports CSS (Leaflet, leaflet-atlas, custom)
  ├─ Creates MapApp from leaflet-atlas
  └─ Passes config to MapApp
       ↓
src/config.ts (declarative configuration)
  ├─ Map setup (center, zoom, base layers)
  ├─ Layer definitions (what GeoJSON files to load)
  ├─ Styles (colors, widths, fills)
  ├─ Interaction (search, tooltips, detail panels)
  └─ Hook: onReady → calls initChrono()
       ↓
src/chrono.js (temporal logic)
  ├─ Creates timeline slider control
  ├─ Manages comparison mode (swipe left/right)
  ├─ Updates orthophoto layers on year change
  ├─ Syncs dependent layers (buildings change color by year)
  └─ Saves user preferences to localStorage
```

## Key Concepts

### 1. Config-Driven Architecture

Instead of imperative code, ChronoMEL uses declarative config (like a layout/template system):

```typescript
// Declarative: Just describe WHAT to show, not HOW to show it
export const config = {
  layerGroups: [{...}],
  styles: {...},
  detailBuilders: {...},
};
```

leaflet-atlas interprets this config and:
- Loads GeoJSON files
- Applies styles
- Creates UI panels (layer list, search, details)
- Handles user interactions

### 2. WMS Orthophotographies (Temporal Raster)

Orthophotos are served as **Web Map Service (WMS)** from GeoServer:

- One URL per year (1930-2025)
- Displays aerial imagery
- `src/wms.js` manages the WMS layer factory
- Timeline change → request new WMS tile set

### 3. Vector Layers (Points/Lines/Polygons)

Static GeoJSON files that don't change by year:

- `communes-mel.geojson` — Commune boundaries
- `transport.geojson` — Rail networks
- `vegetation.geojson` — Green spaces

**Selectively temporal:**
- `bati-remarquable.geojson` — Buildings with `annee` (construction year) property
- Timeline change → color change based on `annee` vs. selected year

### 4. Temporal Projection

Key mechanism: Feature properties are compared to the selected year.

**Example: "Bâti remarquable" (historical buildings)**

```javascript
// In bati sync function:
if (annee >= p.annee) {
  // Building was built by this year → show it, color it fully
} else {
  // Not yet built in this year → fade/hide it
}
```

This creates the illusion of watching the territory grow over time.

## File Organization

```
src/
├── main.js                 Entry point (creates MapApp)
├── config.ts              Declarative map configuration
├── chrono.js              Temporal logic (timeline, comparison)
├── timeline-control.js    Timeline slider UI
├── compare-control.js     Comparison mode (side-by-side)
├── swipe-control.js       Comparison mode (swipe/curtain)
├── wms.js                 Orthophoto WMS layer factory
├── ortho-millesimes.js    Available year list
├── bati-remarquable.js    Historical buildings metadata & coloring
├── analytics.js           GoatCounter integration
└── css/
    └── app.css            Custom styles

public/data/
├── communes-mel.geojson   Commune boundaries
├── bati-remarquable.geojson  Historical buildings
├── transport.geojson      Rail networks
├── hydro-*.geojson        Water features
├── vegetation.geojson     Green spaces
└── equipements.geojson    Facilities (hospitals, schools, etc.)

scripts/
├── refresh-*.mjs          Monthly data refresh scripts
└── lib/
    └── bdtopo.mjs         Shared BD TOPO API utility
```

## Control Flow: Year Selection

When user drags timeline slider:

```
1. User drags timeline slider
2. timeline-control.js emits 'change' event with new year
3. chrono.js listens → calls:
   - updateOrthophoto(year) → new WMS layer
   - syncBati(year) → rebuild bati style/visibility
   - syncOther layers as needed
4. savePreferences(year) → localStorage
5. Map re-renders
```

## Interaction Pipeline

```
User Action → Event → Handler → Update → Render
     ↓          ↓       ↓         ↓        ↓
  Click     leaflet  search    UI state  map
  feature   event   handler    update  repaint
    ↓
  Show detail panel (from detailBuilders)
```

## Data Flow: GeoJSON Loading

1. **Config defines file references:**
   ```typescript
   { id: 'communes', file: 'data/communes-mel.geojson' }
   ```

2. **leaflet-atlas loads files:**
   - Fetches from `public/data/*.geojson`
   - Parses as GeoJSON
   - Creates Leaflet layers

3. **Styles applied:**
   - From `styles` config object
   - Creates visual appearance

4. **Interaction attached:**
   - Tooltips on hover
   - Details on click
   - Search indexing

## Comparison Modes

Two ways to compare years:

### Timeline Mode
- Single timeline slider
- One orthophoto + one year of all other data
- Scroll to scrub through time

### Comparison Mode
- Two timelines (left/right)
- WMS layer split down middle (swipe) or side-by-side
- Compare specific years

Switch in `src/chrono.js` via `setMode()`.

## Performance Considerations

- **WMS tiling:** Pre-cached at GeoServer, CDN-served
- **Vector layers:** GeoJSON files loaded once, cached in browser
- **Dynamic styling:** Applied in-browser (no server round trip)
- **Zoom-based loading:** Leaflet handles LOD

Typical load:
- Map + layers: ~2-3 MB GeoJSON
- Current year orthophoto: 50-100 MB tiles
- Navigation: Instant (cached tiles)

## Extension Points

To customize behavior:

1. **Add new layers** → Modify `src/config.ts`
2. **Change temporal logic** → Edit `src/chrono.js` (add sync functions)
3. **New comparison mode** → Create control in `src/` (follow pattern of swipe-control.js)
4. **New base layer** → Add to `config.baseLayers`
5. **Analytics events** → Configure in `src/analytics.js`

---

See also:
- [Temporal Data Handling](temporal-data-handling.md)
- [Configuration Patterns](config-patterns.md)
