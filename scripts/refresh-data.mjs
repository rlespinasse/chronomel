#!/usr/bin/env node
// Récupère le contour des communes de la Métropole Européenne de Lille depuis
// l'API OGC Features du GeoServer métropolitain et l'écrit en GeoJSON statique.
// Les coordonnées sont fournies en CRS84 (WGS84 lon/lat), directement
// exploitables par Leaflet.
//
// Source : dataset « Communes de la Métropole Européenne de Lille » (data.gouv.fr)

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE =
  'https://data.lillemetropole.fr/geoserver/ogc/features/v1/collections/mel_limite_administrative:mel_comm_orga/items';

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'data',
  'communes-mel.geojson',
);

async function fetchAllFeatures() {
  const features = [];
  let url = `${BASE}?f=application/json&limit=1000`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Échec de la requête (${res.status}) : ${url}`);
    }
    const page = await res.json();
    features.push(...(page.features ?? []));

    const next = (page.links ?? []).find((l) => l.rel === 'next');
    const done = page.numberReturned != null && page.numberReturned === 0;
    url = next && !done ? next.href : null;
  }

  return features;
}

async function main() {
  const features = await fetchAllFeatures();
  if (features.length === 0) {
    throw new Error('Aucune commune récupérée — API indisponible ou modifiée ?');
  }

  const collection = { type: 'FeatureCollection', features };
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(collection));

  console.log(`✓ ${features.length} communes écrites dans ${OUTPUT}`);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
