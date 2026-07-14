# Configuration API Reference

Complete reference for `src/config.ts` schema.

## Top-Level Config Object

```typescript
export const config = {
  map: {...},
  title: {...},
  baseLayers: {...},
  defaultBaseLayer: string,
  analytics?: {...},
  layerGroups: [...],
  contextLayers: [...],
  geometryTypes: {...},
  styles: {...},
  searchableProps?: {...},
  tooltips: {...},
  detailBuilders: () => ({...}),
  legalPages?: [...],
  onReady?: (app: MapApp) => void,
};
```

## map

Map initialization settings.

```typescript
map: {
  elementId: 'map',           // DOM element to mount to
  center: [lat, lng],         // [50.63, 3.06] for Lille
  zoom: number,               // 11
  zoomSnap: number,           // 0.25 for quarter-zoom increments
}
```

## title

Header display (leaflet-atlas UI).

```typescript
title: {
  heading: 'ChronoMEL',                    // Main title
  subtitle: 'Orthophotographies...',       // Subtitle
  icon?: 'logo.svg',                       // Icon path (public/logo.svg)
}
```

## baseLayers

Available background maps.

```typescript
baseLayers: {
  'Layer Name': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '© OpenStreetMap',     // Required for attribution
    },
  },
},
defaultBaseLayer: 'Layer Name',           // Initially selected
```

## layerGroups

Grouped vector layers (appear in panel).

```typescript
layerGroups: [
  {
    group: 'Group Name',
    layers: [
      {
        id: 'unique-id',
        label: 'Display Name',
        file: 'data/filename.geojson',    // Relative to public/
        active: boolean,                   // Initially visible?
      },
    ],
  },
],
```

## contextLayers

Static context layers (always in "Context" section).

Same structure as layerGroups[].layers[].

```typescript
contextLayers: [
  {
    id: 'transport',
    label: 'Rail Networks',
    file: 'data/transport.geojson',
    active: false,
  },
],
```

## geometryTypes

Declare geometry type for each layer (required for proper z-ordering).

```typescript
geometryTypes: {
  'layer-id': 'polygon' | 'point' | 'line',
},
```

Values:
- `'polygon'` — GeoJSON Polygon/MultiPolygon
- `'point'` — GeoJSON Point/MultiPoint
- `'line'` — GeoJSON LineString/MultiLineString

## styles

Visual styling for each layer.

```typescript
styles: {
  'layer-id': {
    color?: '#ff0000',           // Outline color (hex)
    weight?: 2,                  // Outline width (pixels)
    opacity?: 1,                 // Outline opacity (0-1)
    fill?: true,                 // Fill polygon/point?
    fillColor?: '#ff6600',       // Fill color (hex)
    fillOpacity?: 0.5,           // Fill opacity (0-1)
    radius?: 5,                  // Point radius (triggers circleMarker for points)
    dashArray?: '5, 10',         // Dashed line pattern
    lineCap?: 'round',           // 'round' | 'butt' | 'square'
    lineJoin?: 'round',          // 'round' | 'bevel' | 'miter'
  },
},
```

## searchableProps

Make layers searchable by property.

```typescript
searchableProps: {
  'layer-id': {
    title: (props) => props.name,              // Search result title
    meta: (props) => props.type,               // Subtitle/metadata
    text: ['name', 'description', 'keywords'], // Fields to search
  },
},
```

## tooltips

Hover tooltips on features.

```typescript
tooltips: {
  'layer-id': (properties) => string,
},
```

Example:
```typescript
communes: (p) => `${p.nom} (${p.code_insee})`,
bati: (p) => `${p.nature} · ${p.annee}`,
```

## detailBuilders

Detailed panel content (click feature to show).

```typescript
detailBuilders: () => ({
  'layer-id': (properties) => string,  // Return HTML string
}),
```

**Must be a function returning an object** (lazily evaluated).

Example:
```typescript
detailBuilders: () => ({
  communes: (p) => `
    <h2>${escapeHtml(p.nom)}</h2>
    <dl>
      <dt>Population</dt>
      <dd>${p.population.toLocaleString()}</dd>
      <dt>Area</dt>
      <dd>${p.surface_km2} km²</dd>
    </dl>
  `,
}),
```

## legalPages (optional)

Custom legal/info pages (accessible from info menu).

```typescript
legalPages: [
  {
    id: 'unique-id',
    label: 'Page Title',
    content: '<h2>Page Title</h2><p>...',   // HTML string
  },
],
```

## analytics (optional)

Analytics configuration (GoatCounter).

```typescript
analytics: {
  endpoint: string,             // GoatCounter endpoint URL
  // Other vendor-specific settings
},
```

## onReady (optional)

Hook called after map is initialized. Receives MapApp instance.

```typescript
onReady: (app) => {
  // Called after leaflet-atlas setup
  // Add custom controls, event listeners, etc.
  initChrono(app);  // ChronoMEL's temporal setup
},
```

## Type Helpers

### escapeHtml

Utility function to escape HTML in user data:

```typescript
const escapeHtml = (value?: string | number | null): string => {...};

// Usage:
`<h2>${escapeHtml(p.name)}</h2>`
```

Escapes: `&`, `<`, `>`, `"`

---

## Complete Example

```typescript
export const config = {
  map: {
    elementId: 'map',
    center: [50.63, 3.06],
    zoom: 11,
    zoomSnap: 0.25,
  },

  title: {
    heading: 'My Atlas',
    subtitle: 'Temporal geospatial viewer',
    icon: 'logo.svg',
  },

  baseLayers: {
    'OpenStreetMap': {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      },
    },
  },
  defaultBaseLayer: 'OpenStreetMap',

  layerGroups: [{
    group: 'My Data',
    layers: [{
      id: 'communes',
      label: 'Communes',
      file: 'data/communes.geojson',
      active: true,
    }],
  }],

  geometryTypes: {
    communes: 'polygon',
  },

  styles: {
    communes: {
      color: '#ffffff',
      weight: 1,
      opacity: 0.9,
      fill: true,
      fillOpacity: 0,
    },
  },

  tooltips: {
    communes: (p) => p.nom,
  },

  detailBuilders: () => ({
    communes: (p) => `<h2>${p.nom}</h2>`,
  }),

  onReady: (app) => initChrono(app),
};
```

---

See also:
- [Add a Layer](../how-to/add-layer.md)
- [Customize Styling](../how-to/customize-styling.md)
