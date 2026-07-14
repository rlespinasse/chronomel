# How to Configure the Timeline

The timeline slider (bottom of screen) controls which year's orthophotography is displayed.

## Basic Configuration

Timeline behavior is configured in `src/chrono.js`. Here are the key settings:

### Year Range

Currently hardcoded to 1930-2025. To change:

1. Open `src/chrono.js`
2. Find the timeline initialization
3. Update `minYear` and `maxYear`

```javascript
const minYear = 1950;  // Start from 1950 instead
const maxYear = 2024;  // End at 2024
```

### Available Millesimes (Orthophoto Years)

In `src/ortho-millesimes.js`, define which years have available imagery:

```javascript
export const millesimes = [
  1930, 1950, 1970, 2000, 2015, 2020, 2023, 2025
];
```

Only these years will snap to when dragging the timeline.

### Timeline Appearance

To customize colors, height, or behavior, edit the timeline control in `src/timeline-control.js`.

## Advanced: Custom Year Labels

Millesimes can have labels (e.g., "2020 (Recent)" or "1970 (Historic)"):

```javascript
export const millesimes = [
  { year: 1930, label: '1930 (Earliest)' },
  { year: 1970, label: '1970 (Historic)' },
  { year: 2025, label: '2025 (Current)' },
];
```

## Linking Layers to Years

Some layers (like "Bâti remarquable") change appearance based on the selected year.

The function `syncBati()` in `src/chrono.js` shows the pattern:

1. Listen to timeline change events
2. Call `getMillesimeAffiche()` to get current year
3. Update layer visibility/styling based on year
4. Use feature properties (e.g., `construction_year`) to determine state

To apply this to custom layers:

```javascript
function syncMyLayer() {
  const year = getMillesimeAffiche();
  // Update visibility/colors based on year
  // Rebuild feature styles
}

// Call on timeline change
timeline.on('change', syncMyLayer);
```

## Controlling Multiple Comparison Modes

The comparison mode (swipe between two years) uses two timeline instances:

- **Left timeline** — First year
- **Right timeline** — Second year

Configure separately in `src/chrono.js` under the comparison mode setup.

## Troubleshooting

**Timeline doesn't appear?**
- Check `src/chrono.js` — ensure `initChrono()` is called from `src/config.ts`
- Verify orthophoto WMS endpoint is accessible

**Layers don't change when timeline moves?**
- Ensure your layer has a sync function (like `syncBati`)
- Check that features have year/date properties
- Verify event listeners are attached

**Years snap strangely?**
- Check `millesimes` array in `src/ortho-millesimes.js`
- Years should be in ascending order

---

See also:
- [Timeline Control Reference](../reference/cli-commands.md)
- [Temporal Data Handling](../explanation/temporal-data-handling.md)
- [Architecture: Temporal Projection](../explanation/architecture.md)
