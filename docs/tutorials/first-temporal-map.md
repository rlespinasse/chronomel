# Build Your First Temporal Map (15 minutes)

Create a temporal map of any French region by adding your own layer to ChronoMEL.

## Goal

Add a layer showing population density by commune, changing color based on the selected year.

## Prerequisites

- 5 minutes from [Quick Start](quickstart.md)
- A code editor (VS Code recommended)
- Terminal open in project directory

## Step 1: Get Your Data (3 min)

We'll use the INSEE communes dataset from data.gouv.fr:

```bash
# Download communes data
curl -o public/data/communes-custom.geojson \
  'https://www.data.gouv.fr/api/1/datasets/communes-de-la-metropole-europeenne-de-lille/...'
```

Or use Claude Code's discover skill:

```
/geopages:discover-dataset "communes MEL population"
```

Then ask: "Download that and add to public/data/communes-pop.geojson"

## Step 2: Add Layer to Config (5 min)

Open `src/config.ts` and find the `layerGroups` section.

Add a new layer:

```typescript
{
  group: 'Analyse Spatiale',
  layers: [
    {
      id: 'communes-pop',
      label: 'Communes par densité',
      file: 'data/communes-pop.geojson',
      active: false,
    },
  ],
},
```

## Step 3: Configure Styling (4 min)

Find the `styles` section. Add color-by-property styling:

```typescript
'communes-pop': {
  color: '#333333',
  weight: 1,
  opacity: 0.8,
  fill: true,
  fillOpacity: 0.7,
  // fillColor will be set dynamically by feature properties
},
```

Add to `tooltips`:

```typescript
'communes-pop': (p) => `${p.nom}: ${p.population.toLocaleString()} hab.`,
```

Add to `detailBuilders`:

```typescript
'communes-pop': (p) => `
  <h2>${p.nom}</h2>
  <dl>
    <dt>Population</dt>
    <dd>${p.population.toLocaleString()} hab.</dd>
    <dt>Density</dt>
    <dd>${(p.population / p.surface_km2).toFixed(0)} hab./km²</dd>
  </dl>
`,
```

## Step 4: Test It (3 min)

The dev server should auto-reload. Open http://localhost:5173:

1. **Open layer panel** (top right)
2. **Scroll to "Analyse Spatiale"**
3. **Click "Communes par densité"** to toggle on
4. **Click a commune** to see details

You've created your first temporal layer!

## Next: Make It Temporal

To change colors by year:

1. See [Temporal Data Handling](../explanation/temporal-data-handling.md)
2. Modify `chrono.js` to call a function that updates colors based on `getMillesimeAffiche()`
3. Use the pattern from the "Bâti remarquable" layer (building colors change by year)

## Troubleshooting

**Layer doesn't appear?**
- Check browser console (F12) for errors
- Verify GeoJSON file exists in `public/data/`
- Run `npm run validate-config`

**Colors look wrong?**
- Ensure fillOpacity is > 0
- Check geometryTypes: communes should be 'polygon'
- Verify GeoJSON is valid (use Mapshaper.org to test)

---

[← Back to tutorials](../README.md)
