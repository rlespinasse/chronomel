#!/usr/bin/env node
// Extrait le « réseau ferré structurant » de la Métropole Européenne de Lille
// depuis la BD TOPO de l'IGN (tronçons de voie ferrée) et l'écrit en GeoJSON
// statique de lignes : métro (VAL), tramway (Mongy) et voies ferrées.
//
// Couche de CONTEXTE statique : la BD TOPO ne porte pas de date d'apparition
// exploitable sur ces objets, le réseau est donc affiché tel quel (repère
// permanent), sans projection temporelle.
//
// Source : BD TOPO® © IGN, diffusée sur data.gouv.fr / Géoplateforme.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchBdTopoFeatures,
  bboxCql,
  simplifyGeometry,
  writeCollection,
} from './lib/bdtopo.mjs';

// Tolérance de simplification Douglas-Peucker (degrés ; ~0,00004° ≈ 4 m) :
// fine pour préserver les courbes du métro et du tramway.
const SIMPLIFY_TOL = 0.00004;

// Natures BD TOPO retenues → catégorie ChronoMEL (sert au libellé / au style).
const NATURES = {
  Métro: 'metro',
  Tramway: 'tramway',
  'Voie ferrée principale': 'ferre',
  'Voie de service': 'ferre',
};

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'data',
  'transport.geojson',
);

function buildCql() {
  const naturesList = Object.keys(NATURES)
    .map((n) => `'${n}'`)
    .join(',');
  return `nature IN (${naturesList}) AND ${bboxCql()}`;
}

async function main() {
  const raw = await fetchBdTopoFeatures({
    typename: 'BDTOPO_V3:troncon_de_voie_ferree',
    cql: buildCql(),
    properties: ['nature', 'geometrie'],
  });

  const features = [];
  for (const f of raw) {
    const geometry = simplifyGeometry(f.geometry, SIMPLIFY_TOL);
    if (!geometry) continue;
    features.push({
      type: 'Feature',
      geometry,
      properties: {
        nature: f.properties.nature ?? null,
        categorie: NATURES[f.properties.nature] ?? 'ferre',
      },
    });
  }

  if (features.length === 0) {
    throw new Error('Aucun tronçon ferré récupéré — service WFS indisponible ou filtre modifié ?');
  }

  const { count, sizeKo } = await writeCollection(OUTPUT, features);
  console.log(`✓ ${count} tronçons ferrés (${sizeKo} Ko) écrits dans ${OUTPUT}`);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
