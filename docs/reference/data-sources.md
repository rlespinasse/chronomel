# Data Sources

Reference for every data source ChronoMEL fetches from, and the script
that owns it. All sources are French public open data, published under
either the *Licence Ouverte 2.0 (Etalab)* or the *ODbL*.

## Orthophotographies (WMS)

**Publisher:** Métropole Européenne de Lille — served via the
metropolitan GeoServer's WMS endpoint:

```
https://mel-geoserver.lillemetropole.fr/geoserver/Raster/ows
```

Layer names and available years are catalogued in
`src/ortho-millesimes.js` (`MILLESIMES` array), verified against the
service's `GetCapabilities` response (see the comment at the top of that
file for the exact request URL). Nineteen millésimes are currently
declared, from 1930 to 2025, with several years offering variants
(infrared, stereoscopic, without building lean correction, CCPC
perimeter) — see `CATEGORIES` in the same file.

There is no refresh script for orthophotos: new millésimes are added by
hand to `MILLESIMES` once the metropolitan GeoServer publishes them.

## Communes boundaries

**Publisher:** Métropole Européenne de Lille · **Fetched by:**
`scripts/refresh-data.mjs` · **Output:** `public/data/communes-mel.geojson`

OGC Features API (paginated, CRS84/WGS84 directly, no reprojection
needed):

```
https://data.lillemetropole.fr/geoserver/ogc/features/v1/collections/mel_limite_administrative:mel_comm_orga/items
```

## Bâti remarquable (dated buildings)

**Publisher:** IGN, BD TOPO® (via the Géoplateforme WFS) ·
**Fetched by:** `scripts/refresh-bati-remarquable.mjs` ·
**Output:** `public/data/bati-remarquable.geojson`

Religious, sports, and industrial buildings selected by usage, plus
heritage buildings (castles, forts, triumphal arches, keeps) selected by
nature — both filtered to records carrying a `date_d_apparition`. Each
polygon is reduced to its centroid to keep the file light (~1,200
points). This date is what powers the present/projected temporal
rendering — see
[Temporal Data Handling](../explanation/temporal-data-handling.md).

## Transport network

**Publisher:** IGN, BD TOPO® · **Fetched by:**
`scripts/refresh-transport.mjs` · **Output:** `public/data/transport.geojson`

Railway sections: métro (VAL), tramway (Mongy), and heavy rail. A
context layer — BD TOPO® carries no usable date for these, so no
temporal projection applies.

## Hydrographie

**Publisher:** IGN, BD TOPO® · **Fetched by:** `scripts/refresh-hydro.mjs`
**Output:** `public/data/hydro-cours.geojson` (lines: rivers, canals,
becques) and `public/data/hydro-surfaces.geojson` (polygons: canal
basins, ponds). Split into two files/layers deliberately — see
[Config Patterns](../explanation/config-patterns.md#geometrytypes-is-not-optional)
for why a single filled style can't represent both.

## Végétation

**Publisher:** IGN, BD TOPO® · **Fetched by:**
`scripts/refresh-vegetation.mjs` ·
**Output:** `public/data/vegetation.geojson`

Wooded/forested masses only (filtered by `NATURE` and a minimum area) —
BD TOPO® contains a large number of small vegetation patches (hedges,
thickets) that would make the file heavy and the map noisy; what gets
filtered out is logged rather than silently dropped.

## Équipements structurants

**Publisher:** IGN, BD TOPO® · **Fetched by:**
`scripts/refresh-equipements.mjs` ·
**Output:** `public/data/equipements.geojson`

Points for health (hospitals, clinics), education (schools,
universities), administrative (town halls, services), transport hubs,
sport, and culture facilities. No usable date in BD TOPO® for these
either — shown as a permanent context layer.

## Common conventions across refresh scripts

- All BD TOPO® scripts build a CQL filter (`buildCql()`) against the
  Géoplateforme WFS rather than downloading the full unfiltered dataset
- Output is always written to `public/data/*.geojson`, one file per
  layer
- `npm run validate-config` cross-checks that every layer declared in
  `src/config.ts` has a matching file in `public/data/`

---

See also:

- [Discover Datasets](../how-to/discover-datasets.md) — how to find a new
  source before adding a layer
- [CLI Commands](cli-commands.md) — the `refresh-*` npm scripts
