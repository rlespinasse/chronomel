# How to Add a Layer to the Map

## Quick Reference

1. Get GeoJSON data (from data.gouv.fr or your own source)
2. Save to `public/data/your-layer.geojson`
3. Add to `src/config.ts` in the `layerGroups` or `contextLayers` section
4. Configure `styles`, `tooltips`, and `detailBuilders`
5. Reload browser — done!

## Detailed Steps

### 1. Prepare GeoJSON Data

Your layer needs to be in GeoJSON format (.geojson or .json).

**Validate your GeoJSON:**
- Use [Mapshaper.org](https://mapshaper.org) to test
- Check for invalid geometries (self-intersecting, null coords, etc.)
- For best performance, simplify complex shapes

**Common sources for French data:**
- [data.gouv.fr](https://www.data.gouv.fr) — Official French open data
- [BD TOPO®](https://geoservices.ign.fr/bdtopo) — IGN geographic database
- [Wikidata/Overpass API](https://overpass-turbo.osm.org) — OpenStreetMap-based

### 2. Add to public/data/

```bash
cp your-layer.geojson public/data/
```

File should be ~1-50 MB for smooth loading.

### 3. Declare the Layer

Open `src/config.ts` and choose a group:

**Option A: Main layer group**

```typescript
layerGroups: [
  {
    group: 'My Custom Layers',
    layers: [
      {
        id: 'my-layer',
        label: 'My Layer Name',
        file: 'data/my-layer.geojson',
        active: false,  // Hidden by default
      },
    ],
  },
],
```

**Option B: Context layer (static, always-visible section)**

```typescript
contextLayers: [
  {
    id: 'my-layer',
    label: 'My Layer Name',
    file: 'data/my-layer.geojson',
    active: false,
  },
],
```

### 4. Add Geometry Type

In the `geometryTypes` object, declare what type of geometry your data has:

```typescript
geometryTypes: {
  'my-layer': 'polygon',  // or 'point', 'line'
},
```

**Why?** leaflet-atlas needs this to calculate click priority and z-order correctly.

### 5. Add Styling

In the `styles` object:

```typescript
'my-layer': {
  color: '#ff0000',         // Outline color
  weight: 2,                // Outline width (pixels)
  opacity: 0.8,             // Outline opacity (0-1)
  fill: true,               // For polygon/point
  fillColor: '#ff6600',     // Fill color
  fillOpacity: 0.3,         // Fill opacity
},
```

### 6. Add Tooltip (hover text)

In the `tooltips` object:

```typescript
'my-layer': (feature) => `${feature.properties.name} - ${feature.properties.description}`,
```

Access feature properties via `feature.properties.fieldname`.

### 7. Add Detail Panel (click info)

In `detailBuilders`:

```typescript
detailBuilders: () => ({
  'my-layer': (feature) => `
    <h2>${feature.properties.name}</h2>
    <dl>
      <dt>Type</dt><dd>${feature.properties.type}</dd>
      <dt>Area</dt><dd>${feature.properties.area} km²</dd>
    </dl>
  `,
}),
```

Return HTML string (escape user data with `escapeHtml()` function included in config).

### 8. (Optional) Add to Search

If your layer has searchable properties, add to `searchableProps`:

```typescript
searchableProps: {
  'my-layer': {
    title: (props) => props.name,
    meta: (props) => props.type,
    text: ['name', 'description', 'keywords'],  // Fields to search
  },
},
```

### 9. Test

```bash
npm run dev
```

- Open layer panel (top right)
- Toggle your layer on
- Hover and click to verify tooltip and details
- Check browser console (F12) for errors

## Validation

Before committing, run:

```bash
npm run validate-config
```

This checks:
- GeoJSON files exist and are valid
- Config references match geometry types
- Required fields are present

## Tips

**Performance:**
- For >10k features, consider splitting into multiple files
- Simplify geometries (use Mapshaper)
- Avoid deeply nested properties (flat structure is faster)

**Styling:**
- Use semi-transparent fills (fillOpacity < 1) so layers show through
- Match the existing color palette
- Test with both light/dark mode (if applicable)

**Data Refresh:**
- If data changes regularly, use the `scripts/refresh-*.mjs` pattern
- See [Data Refresh Scripts](../reference/data-sources.md)

---

See also:
- [Temporal Data Handling](../explanation/temporal-data-handling.md) — Dynamic colors by year
- [Styling Guide](customize-styling.md) — Advanced color and visual options
- [Discover Datasets](discover-datasets.md) — Using datagouv MCP to find data
