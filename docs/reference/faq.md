# FAQ

## Why is TypeScript pinned to 6.x?

`package.json` pins `typescript` to `6.0.3` instead of the current major
(7.x). `typescript-eslint` — the package that lets ESLint parse and lint
`.ts` files — does not yet support TypeScript 7, and refuses to run at
all against it ("typescript-eslint does not support TS 7.0"). Until an
upstream release adds that support, staying on the last TS 6.x release is
what keeps `npm run lint` covering `src/config.ts` instead of silently
skipping it.

## Why does `src/atlas-config.js` look identical to `config.ts`?

It's a leftover from the TypeScript migration — nothing imports it (see
[Config Patterns](../explanation/config-patterns.md#a-stray-duplicate-atlas-configjs)).
`config.ts` is the file that's actually used.

## Why is there no "demolished" state for old buildings?

BD TOPO® (the bâti remarquable source) only carries a construction date,
not a demolition date. ChronoMEL can only render "present" or
"projected" (not yet built) — asserting a building still stands today
just because the data doesn't say otherwise would misrepresent
buildings that were, in fact, torn down. See
[Temporal Data Handling](../explanation/temporal-data-handling.md#present-vs-projected--not-presentpastfuture).

## Why do some years have multiple orthophotos?

Some millésimes were captured with multiple processing variants —
infrared (`irc`), stereoscopic, without building-lean correction
(`sans-devers`), or a different coverage perimeter (`ccpc`). Only one
per year is `principal` (shown on the main timeline slider); the others
appear as pills once you're on that year. See
[Configure the Timeline](../how-to/configure-timeline.md#advanced-custom-year-labels)
and `CATEGORIES` in `src/ortho-millesimes.js`.

## Why isn't every year from 1930 to 2025 covered?

Orthophoto flights aren't annual — the metropolitan GeoServer only
publishes years it actually has imagery for (see `MILLESIMES` in
`src/ortho-millesimes.js`). The gaps you see on the timeline (e.g.
nothing between 2011 and 2016) reflect genuine gaps in the source
imagery, not a ChronoMEL limitation.

## Some layers never change when I move the timeline — is that a bug?

No. Only **bâti remarquable** reacts to the selected year. Communes,
transport, hydrographie, végétation, and équipements are context layers
without an exploitable date in BD TOPO® — they're shown as permanent
reference features. See
[Temporal Data Handling](../explanation/temporal-data-handling.md#two-kinds-of-layers).

## What keyboard shortcuts are available?

| Key       | Action                                                 |
| --------- | ------------------------------------------------------ |
| `,` / `<` | Previous millésime (timeline mode only)                |
| `.` / `>` | Next millésime (timeline mode only)                    |
| `Home`    | Jump to 1930 (timeline mode only)                      |
| `End`     | Jump to 2025 (timeline mode only)                      |
| `v` / `V` | Cycle the current year's variants (timeline mode only) |
| `m` / `M` | Toggle timeline / compare mode (either mode)           |

These are also listed in the in-app help overlay (`?` icon), injected at
runtime by `injectHelpRows()` in `src/chrono.js`.

## How do I check that a config change didn't break anything?

```bash
npm run validate-all
```

This runs `validate-config` (every declared layer has a matching,
parseable GeoJSON file) followed by `build`. Run this before opening a
PR — see [CLI Commands](cli-commands.md#configuration-validation).

## Where do I report a data error?

Data quality issues (a building's wrong construction date, a missing
commune…) originate from BD TOPO® or the MEL's own datasets, not from
ChronoMEL's code — see [Data Sources](data-sources.md) for the
publisher of each layer. For a ChronoMEL-specific bug, open an issue on
the [GitHub repository](https://github.com/rlespinasse/chronomel/issues).

---

See also:

- [Configuration API](config-api.md)
- [Data Sources](data-sources.md)
- [Temporal Data Handling](../explanation/temporal-data-handling.md)
