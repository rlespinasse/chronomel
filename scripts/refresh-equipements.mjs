#!/usr/bin/env node
// Extrait les « équipements structurants » de la Métropole Européenne de Lille
// depuis la BD TOPO de l'IGN (zones d'activité ou d'intérêt) et l'écrit en
// GeoJSON statique de points : santé (hôpitaux, cliniques), enseignement
// (écoles, universités), administratif (mairies, services), transport (gares),
// sport et culture.
//
// Couche de CONTEXTE statique. ATTENTION : ces objets ne portent PAS de date
// d'apparition exploitable dans la BD TOPO — contrairement au bâti remarquable,
// ils ne peuvent donc pas être projetés dans le temps et sont affichés tels
// quels. Chaque zone (polygone) est réduite à son centroïde (marqueur léger).
//
// Source : BD TOPO® © IGN, diffusée sur data.gouv.fr / Géoplateforme.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchBdTopoFeatures,
  bboxCql,
  centroid,
  round5,
  writeCollection,
} from './lib/bdtopo.mjs';

// Catégories BD TOPO retenues → catégorie ChronoMEL (sert au libellé / au style).
const CATEGORIES = {
  Santé: 'sante',
  'Science et enseignement': 'enseignement',
  'Administratif ou militaire': 'administratif',
  Transport: 'transport',
  Sport: 'sport',
  'Culture et loisirs': 'culture',
};

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'data',
  'equipements.geojson',
);

function buildCql() {
  const categoriesList = Object.keys(CATEGORIES)
    .map((c) => `'${c}'`)
    .join(',');
  return `categorie IN (${categoriesList}) AND ${bboxCql()}`;
}

/** Point représentatif d'une zone : ses coordonnées si Point, sinon centroïde. */
function pointFor(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Point') {
    return [round5(geometry.coordinates[0]), round5(geometry.coordinates[1])];
  }
  return centroid(geometry);
}

async function main() {
  const raw = await fetchBdTopoFeatures({
    typename: 'BDTOPO_V3:zone_d_activite_ou_d_interet',
    cql: buildCql(),
    properties: ['nature', 'categorie', 'toponyme', 'geometrie'],
  });

  const features = [];
  for (const f of raw) {
    const point = pointFor(f.geometry);
    if (!point) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: point },
      properties: {
        nom: f.properties.toponyme ?? null,
        nature: f.properties.nature ?? null,
        categorie: CATEGORIES[f.properties.categorie] ?? 'autre',
      },
    });
  }

  if (features.length === 0) {
    throw new Error('Aucun équipement récupéré — service WFS indisponible ou filtre modifié ?');
  }

  const { count, sizeKo } = await writeCollection(OUTPUT, features);
  console.log(`✓ ${count} équipements structurants (${sizeKo} Ko) écrits dans ${OUTPUT}`);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
