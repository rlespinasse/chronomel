#!/usr/bin/env node
// Extrait l'« hydrographie » de la Métropole Européenne de Lille depuis la
// BD TOPO de l'IGN et l'écrit en GeoJSON statique :
//   - cours d'eau (lignes) : la Deûle, la Marque, les becques… ;
//   - surfaces hydrographiques (polygones) : canaux, plans d'eau.
//
// Couche de CONTEXTE statique (pas de date exploitable). L'eau structure
// l'histoire industrielle de la métropole : utile en repère permanent.
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

// Tolérance de simplification Douglas-Peucker (degrés ; ~0,00007° ≈ 8 m).
const SIMPLIFY_TOL = 0.00007;

// Surface minimale conservée pour les plans d'eau (m²). La BD TOPO contient des
// milliers de petits bassins/mares : on les écarte pour garder un fichier léger.
const MIN_SURFACE_M2 = 5_000; // ~0,5 hectare

// Deux fichiers distincts : leaflet-atlas applique un style unique par couche,
// or un même `fill` conviendrait aux polygones (plans d'eau remplis et
// cliquables sur tout l'intérieur) mais refermerait visuellement les
// polylignes des cours d'eau en une fausse surface. On sépare donc lignes et
// polygones en deux couches stylées indépendamment.
const dataPath = (name) =>
  resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', name);
const OUTPUT_COURS = dataPath('hydro-cours.geojson');
const OUTPUT_SURFACES = dataPath('hydro-surfaces.geojson');

async function main() {
  // Cours d'eau (lignes) — `toponyme` souvent renseigné pour les axes nommés.
  const cours = await fetchBdTopoFeatures({
    typename: 'BDTOPO_V3:cours_d_eau',
    cql: bboxCql(),
    properties: ['toponyme', 'geometrie'],
  });

  // Surfaces hydrographiques (polygones) — canaux, plans d'eau.
  const surfaces = await fetchBdTopoFeatures({
    typename: 'BDTOPO_V3:surface_hydrographique',
    cql: `nature IS NOT NULL AND ${bboxCql()}`,
    properties: ['nature', 'geometrie'],
  });

  const coursFeatures = [];
  const surfaceFeatures = [];

  for (const f of cours) {
    const geometry = simplifyGeometry(f.geometry, SIMPLIFY_TOL);
    if (!geometry) continue;
    coursFeatures.push({
      type: 'Feature',
      geometry,
      properties: {
        categorie: 'cours',
        nom: f.properties.toponyme ?? null,
        nature: 'Cours d’eau',
      },
    });
  }

  let droppedSurfaces = 0;
  for (const f of surfaces) {
    if (!f.geometry) continue;
    if (polygonAreaM2(f.geometry) < MIN_SURFACE_M2) {
      droppedSurfaces++;
      continue;
    }
    const geometry = simplifyGeometry(f.geometry, SIMPLIFY_TOL);
    if (!geometry) continue;
    surfaceFeatures.push({
      type: 'Feature',
      geometry,
      properties: {
        categorie: 'surface',
        nom: null,
        nature: f.properties.nature ?? 'Surface en eau',
      },
    });
  }

  if (coursFeatures.length === 0 && surfaceFeatures.length === 0) {
    throw new Error('Aucun objet hydrographique récupéré — service WFS indisponible ou filtre modifié ?');
  }

  const cw = await writeCollection(OUTPUT_COURS, coursFeatures);
  const sw = await writeCollection(OUTPUT_SURFACES, surfaceFeatures);
  console.log(
    `✓ ${cw.count} cours d'eau (${cw.sizeKo} Ko) → ${OUTPUT_COURS}\n` +
      `✓ ${sw.count} surfaces ≥ 0,5 ha (${sw.sizeKo} Ko, ${droppedSurfaces} petites écartées) → ${OUTPUT_SURFACES}`,
  );
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
