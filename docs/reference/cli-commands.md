# CLI Commands

Reference for every `npm run` script defined in `package.json`.

## Development

| Command           | Description                                          |
| ------------------ | ------------------------------------------------------ |
| `npm run dev`       | Start the Vite dev server with hot reload             |
| `npm run build`     | Production build (output in `dist/`)                  |
| `npm run preview`   | Serve the production build locally to sanity-check it |

## Code quality

| Command               | Description                                          |
| ----------------------- | ------------------------------------------------------ |
| `npm run lint`           | Run ESLint (`eslint .`)                               |
| `npm run lint:fix`       | Run ESLint with `--fix`                               |
| `npm run format`         | Format the codebase with Prettier                     |
| `npm run format:check`   | Check formatting without writing changes (used in CI) |

ESLint is configured for both `.js` and `.ts` files via
`typescript-eslint` — see the note on the TypeScript version pin in the
[FAQ](faq.md#why-is-typescript-pinned-to-6x).

## Configuration validation

| Command                   | Description                                                         |
| --------------------------- | ----------------------------------------------------------------------- |
| `npm run validate-config`    | Runs `scripts/validate-config.mjs` — checks that every layer id in `src/config.ts` has a matching, valid GeoJSON file under `public/data/`, and that `geometryTypes`/`styles`/`tooltips`/`detailBuilders` sections exist |
| `npm run validate-all`       | `validate-config` followed by `build` — the full pre-PR check          |

## Data refresh

Each of these re-fetches one layer's source and overwrites its file
under `public/data/`. See [Data Sources](data-sources.md) for what each
one fetches and from where.

| Command                     | Layer                          |
| ------------------------------ | --------------------------------- |
| `npm run refresh-data`          | Communes boundaries              |
| `npm run refresh-bati`          | Bâti remarquable (dated buildings) |
| `npm run refresh-transport`      | Transport network (métro/tram/rail) |
| `npm run refresh-hydro`          | Hydrographie (cours d'eau + surfaces) |
| `npm run refresh-vegetation`     | Végétation (masses boisées)       |
| `npm run refresh-equipements`    | Équipements structurants          |

`.github/workflows/refresh-data.yml` runs these on a schedule and opens a
PR with the resulting diff — see
[Deploy to GitHub Pages](../how-to/deploy-to-github-pages.md#data-refresh).

---

See also:

- [Data Sources](data-sources.md)
- [Configuration API](config-api.md)
