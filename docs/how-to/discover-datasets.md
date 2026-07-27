# How to Discover Datasets

Before [adding a layer](add-layer.md), you need a GeoJSON source. This
guide covers the two ways to find one: browsing data.gouv.fr manually, or
using the **datagouv MCP server** (available in Claude Code) to search and
inspect datasets without leaving your editor.

## Using the datagouv MCP server

If you're working with Claude Code, the `datagouv` MCP server exposes
tools to search and query data.gouv.fr directly:

| Tool                                                                            | Use it to…                                                                                                                                                                         |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search_datasets`                                                               | Find datasets by keyword (e.g. "bâti remarquable Lille")                                                                                                                           |
| `get_dataset_info`                                                              | Inspect a dataset's metadata, license, and resources                                                                                                                               |
| `list_dataset_resources`                                                        | List the downloadable files/APIs for a dataset                                                                                                                                     |
| `get_resource_info`                                                             | Check a resource's format, size, and schema before fetching                                                                                                                        |
| `query_resource_data`                                                           | Query a tabular resource directly (when data.gouv.fr exposes a queryable API)                                                                                                      |
| `search_organizations`                                                          | Find the official publisher (e.g. "Métropole Européenne de Lille") to trust its data over a mirror                                                                                 |
| `search_dataservices` / `get_dataservice_info` / `get_dataservice_openapi_spec` | Find and inspect live APIs (as opposed to static file dumps) — this is how ChronoMEL's refresh scripts found the MEL GeoServer's OGC Features API and the IGN BD TOPO® WFS service |

**Typical flow for a new layer:**

1. `search_organizations("Métropole Européenne de Lille")` — confirm the
   official publisher account, to avoid picking up an outdated community
   mirror
2. `search_datasets("<theme>")` scoped to that organization
3. `get_dataset_info` on the best match — check the license (ChronoMEL
   only uses Licence Ouverte / ODbL sources, see
   [Data Sources](../reference/data-sources.md))
4. `list_dataset_resources` + `get_resource_info` — prefer a live
   OGC Features/WFS API over a static file dump when both exist: it lets
   `scripts/refresh-*.mjs` re-fetch fresh data on a schedule instead of
   requiring a manual re-download every time
5. If it's an API, `get_dataservice_openapi_spec` gives you the exact
   query parameters (CQL filters, pagination, output CRS) to replicate the
   pattern used in `scripts/refresh-transport.mjs` or
   `scripts/refresh-bati-remarquable.mjs`

## Manual discovery (without MCP)

1. Browse [data.gouv.fr](https://www.data.gouv.fr) or the
   [MEL open data portal](https://www.data.gouv.fr/organizations/metropole-europeenne-de-lille/)
2. Check the license — must be Licence Ouverte (Etalab) or ODbL to match
   ChronoMEL's existing sources
3. Prefer a GeoJSON, OGC Features, or WFS endpoint over a Shapefile/CSV
   dump — it avoids a manual conversion step
4. Note the CRS: ChronoMEL's fetch scripts request `CRS84`/WGS84
   directly from the server when the API supports it (see
   `scripts/refresh-data.mjs`), rather than reprojecting locally

## What ChronoMEL's data actually comes from

All current layers were sourced this way, from two publishers:

- **Métropole Européenne de Lille** — communes boundaries (OGC Features
  API)
- **IGN, BD TOPO®** (via the Géoplateforme WFS) — bâti remarquable,
  transport, hydrographie, végétation, équipements

See [Data Sources](../reference/data-sources.md) for the exact endpoints
and licenses.

---

See also:

- [Add a Layer](add-layer.md) — what to do once you have a GeoJSON file
- [Data Sources](../reference/data-sources.md) — endpoints currently used
  by ChronoMEL's refresh scripts
