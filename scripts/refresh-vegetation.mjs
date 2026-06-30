#!/usr/bin/env node
// Extrait les « espaces verts » (masses végétales) de la Métropole Européenne de
// Lille depuis la BD TOPO de l'IGN (zones de végétation) et l'écrit en GeoJSON
// statique de polygones : bois, forêts, grands parcs arborés.
//
// Couche de CONTEXTE statique (pas de date exploitable). La BD TOPO contient
// énormément de petites zones de végétation (haies, bosquets) : pour garder un
// fichier léger et lisible, on filtre par NATURE (masses boisées) puis par
// SURFACE minimale, et on journalise ce qui est écarté (pas de troncature
// silencieuse).
//
// Source : BD TOPO® © IGN, diffusée sur data.gouv.fr / Géoplateforme.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchBdTopoFeatures,
  bboxCql,
  simplifyGeometry,
  polygonAreaM2,
  writeCollection,
} from './lib/bdtopo.mjs';

// Tolérance de simplification Douglas-Peucker (degrés ; ~0,0001° ≈ 11 m).
const SIMPLIFY_TOL = 0.0001;

// Natures BD TOPO retenues comme « espaces verts » (masses arborées).
const NATURES = [
  'Bois',
  'Forêt fermée de feuillus',
  'Forêt fermée de conifères',
  'Forêt fermée mixte',
  'Forêt ouverte',
  'Peupleraie',
];

// Surface minimale conservée (m²). Écarte haies/bosquets pour alléger.
const MIN_AREA_M2 = 20_000; // ~2 hectares

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'data',
  'vegetation.geojson',
);

function buildCql() {
  const naturesList = NATURES.map((n) => `'${n}'`).join(',');
  return `nature IN (${naturesList}) AND ${bboxCql()}`;
}

async function main() {
  const raw = await fetchBdTopoFeatures({
    typename: 'BDTOPO_V3:zone_de_vegetation',
    cql: buildCql(),
    properties: ['nature', 'geometrie'],
  });

  let dropped = 0;
  const features = [];
  for (const f of raw) {
    if (!f.geometry) continue;
    if (polygonAreaM2(f.geometry) < MIN_AREA_M2) {
      dropped++;
      continue;
    }
    const geometry = simplifyGeometry(f.geometry, SIMPLIFY_TOL);
    if (!geometry) continue;
    features.push({
      type: 'Feature',
      geometry,
      properties: { nature: f.properties.nature ?? 'Végétation' },
    });
  }

  if (features.length === 0) {
    throw new Error('Aucune zone de végétation récupérée — service WFS indisponible ou filtre modifié ?');
  }

  const { count, sizeKo } = await writeCollection(OUTPUT, features);
  console.log(
    `✓ ${count} espaces verts ≥ 2 ha (${dropped} petites zones écartées, ${sizeKo} Ko) écrits dans ${OUTPUT}`,
  );
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
