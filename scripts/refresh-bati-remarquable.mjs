#!/usr/bin/env node
// Extrait le « bâti remarquable daté » de la Métropole Européenne de Lille
// depuis la BD TOPO de l'IGN (service WFS de la Géoplateforme) et l'écrit en
// GeoJSON statique de points.
//
// On retient deux familles de bâtiments datés :
//   - par usage évocateur : religieux, sportif, industriel ;
//   - par nature patrimoniale : châteaux, forts, arcs de triomphe, donjons…
// dans les deux cas filtrés sur la présence d'une date d'apparition. Cela donne
// ~1 200 points : patrimoine + héritage industriel, assez léger pour des
// marqueurs Leaflet sans dépendance de clustering.
//
// Chaque polygone est réduit à son centroïde (suffisant pour un marqueur) afin
// d'alléger le fichier. La date d'apparition (`date_d_apparition`) alimente la
// projection temporelle : un bâtiment « apparaît » sur la carte à partir de son
// millésime de construction.
//
// Source : BD TOPO® © IGN, diffusée sur data.gouv.fr / Géoplateforme.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchBdTopoFeatures,
  bboxCql,
  centroid,
  writeCollection,
} from './lib/bdtopo.mjs';

// Usages BD TOPO retenus → catégorie ChronoMEL (sert au style des marqueurs).
const USAGES = {
  Religieux: 'religieux',
  Sportif: 'sportif',
  Industriel: 'industriel',
};

// Natures patrimoniales BD TOPO → catégorie « patrimoine ». La nature prime sur
// l'usage : un château classé « Résidentiel » reste rangé en patrimoine.
const NATURES_PATRIMOINE = new Set([
  'Château',
  'Fort, blockhaus, casemate',
  'Arc de triomphe',
  'Tour, donjon',
]);

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'data',
  'bati-remarquable.geojson',
);

/** Catégorie ChronoMEL d'un bâtiment (nature patrimoniale prioritaire). */
function categorieFor(props) {
  if (NATURES_PATRIMOINE.has(props.nature)) return 'patrimoine';
  return USAGES[props.usage_1] ?? 'autre';
}

function buildCql() {
  const usagesList = Object.keys(USAGES)
    .map((u) => `'${u}'`)
    .join(',');
  const naturesList = [...NATURES_PATRIMOINE].map((n) => `'${n}'`).join(',');
  return (
    `date_d_apparition IS NOT NULL AND ` +
    `(usage_1 IN (${usagesList}) OR nature IN (${naturesList})) AND ` +
    bboxCql()
  );
}

async function main() {
  const raw = await fetchBdTopoFeatures({
    typename: 'BDTOPO_V3:batiment',
    cql: buildCql(),
    properties: ['nature', 'usage_1', 'date_d_apparition', 'geometrie'],
  });

  const features = [];
  for (const f of raw) {
    const point = centroid(f.geometry);
    if (!point) continue;
    const annee = Number(String(f.properties.date_d_apparition).slice(0, 4));
    if (!Number.isInteger(annee)) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: point },
      properties: {
        nature: f.properties.nature ?? null,
        usage: f.properties.usage_1 ?? null,
        categorie: categorieFor(f.properties),
        annee,
      },
    });
  }

  if (features.length === 0) {
    throw new Error('Aucun bâtiment récupéré — service WFS indisponible ou filtre modifié ?');
  }
  features.sort((a, b) => a.properties.annee - b.properties.annee);

  const { count, sizeKo } = await writeCollection(OUTPUT, features);
  const min = features[0].properties.annee;
  const max = features[features.length - 1].properties.annee;
  console.log(`✓ ${count} bâtiments remarquables (${min}–${max}, ${sizeKo} Ko) écrits dans ${OUTPUT}`);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
