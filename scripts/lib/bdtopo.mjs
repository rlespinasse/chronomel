// Helper partagé pour interroger la BD TOPO de l'IGN via le service WFS de la
// Géoplateforme. Factorise la pagination (boucle STARTINDEX/COUNT), l'emprise
// géographique de la MEL et les paramètres communs, utilisés par tous les
// scripts `refresh-*.mjs` qui figent une couche BD TOPO en GeoJSON statique.
//
// Source : BD TOPO® © IGN, diffusée sur data.gouv.fr / Géoplateforme.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const WFS = 'https://data.geopf.fr/wfs/ows';

// Emprise géographique de la MEL (lon/lat min/max).
export const BBOX = { lonMin: 2.84, latMin: 50.49, lonMax: 3.31, latMax: 50.81 };

const PAGE = 1000; // plafond raisonnable par requête WFS

/** Fragment CQL d'emprise sur la MEL pour un attribut géométrique donné. */
export function bboxCql(geomField = 'geometrie') {
  return `BBOX(${geomField},${BBOX.latMin},${BBOX.lonMin},${BBOX.latMax},${BBOX.lonMax})`;
}

function buildUrl({ typename, cql, properties, startIndex }) {
  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '2.0.0',
    REQUEST: 'GetFeature',
    TYPENAMES: typename,
    SRSNAME: 'CRS:84',
    outputFormat: 'application/json',
    COUNT: String(PAGE),
    STARTINDEX: String(startIndex),
    CQL_FILTER: cql,
  });
  if (properties?.length) {
    params.set('PROPERTYNAME', properties.join(','));
  }
  return `${WFS}?${params}`;
}

/**
 * Récupère toutes les features d'une couche BD TOPO satisfaisant un filtre CQL,
 * en paginant jusqu'à épuisement.
 *
 * @param {object} opts
 * @param {string} opts.typename   Nom de couche WFS (ex. 'BDTOPO_V3:cours_d_eau').
 * @param {string} opts.cql        Filtre CQL (utiliser bboxCql() pour l'emprise).
 * @param {string[]} [opts.properties] Attributs à retourner (optionnel).
 * @returns {Promise<import('geojson').Feature[]>}
 */
export async function fetchBdTopoFeatures({ typename, cql, properties }) {
  const features = [];
  let startIndex = 0;

  for (;;) {
    const url = buildUrl({ typename, cql, properties, startIndex });
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Échec de la requête WFS (${res.status}) sur ${typename}`);
    }
    const page = await res.json();
    const batch = page.features ?? [];
    features.push(...batch);

    if (batch.length < PAGE) break;
    startIndex += PAGE;
  }

  return features;
}

/** Arrondit une coordonnée à 5 décimales (~1 m), pour alléger les GeoJSON. */
export function round5(value) {
  return Math.round(value * 1e5) / 1e5;
}

/**
 * Arrondit récursivement les coordonnées d'une géométrie GeoJSON à 5 décimales
 * et supprime l'altitude (z) renvoyée par la BD TOPO, inutile à Leaflet.
 */
export function roundGeometry(geometry) {
  if (!geometry?.coordinates) return geometry;
  const roundCoords = (c) =>
    typeof c[0] === 'number'
      ? [round5(c[0]), round5(c[1])] // on ne garde que lon/lat (z ignoré)
      : c.map(roundCoords);
  return { ...geometry, coordinates: roundCoords(geometry.coordinates) };
}

// Aire approchée (m²) d'un (Multi)Polygon, via une projection équirectangulaire
// locale centrée sur la latitude de la MEL. Suffisant pour filtrer les petits
// objets (bassins, bosquets) sans dépendance géométrique.
const LAT0 = 50.63;
const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LON = 111_320 * Math.cos((LAT0 * Math.PI) / 180);

function ringAreaM2(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * M_PER_DEG_LON * (y2 * M_PER_DEG_LAT) - x2 * M_PER_DEG_LON * (y1 * M_PER_DEG_LAT);
  }
  return Math.abs(sum) / 2;
}

/** Aire approchée (m²) de l'anneau extérieur d'un Polygon ou MultiPolygon. */
export function polygonAreaM2(geometry) {
  if (!geometry) return 0;
  if (geometry.type === 'Polygon') {
    return ringAreaM2(geometry.coordinates[0] ?? []);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce((acc, poly) => acc + ringAreaM2(poly[0] ?? []), 0);
  }
  return 0;
}

// --- Simplification Douglas-Peucker ----------------------------------------
// Réduit le nombre de sommets des géométries détaillées de la BD TOPO (forêts,
// rivières) tout en préservant leur forme, pour alléger fortement les GeoJSON
// téléchargés par le client (leaflet-atlas charge tous les fichiers au démarrage).

/** Distance perpendiculaire (en degrés) d'un point au segment [a, b]. */
function perpDistance(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Douglas-Peucker sur une suite ordonnée de points [lon, lat]. */
function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= tolerance) {
    return [points[0], points[points.length - 1]];
  }
  const left = douglasPeucker(points.slice(0, index + 1), tolerance);
  const right = douglasPeucker(points.slice(index), tolerance);
  return left.slice(0, -1).concat(right);
}

/** Simplifie un anneau fermé (préserve la fermeture et un minimum de 4 points). */
function simplifyRing(ring, tolerance) {
  const simplified = douglasPeucker(ring, tolerance);
  if (simplified.length < 4) return ring.length >= 4 ? ring : null;
  return simplified;
}

/**
 * Simplifie une géométrie GeoJSON (lignes ou polygones) à la tolérance donnée
 * (en degrés ; ~0,0001° ≈ 11 m). Les coordonnées sont aussi arrondies à 5
 * décimales. Renvoie null si la géométrie s'effondre.
 */
export function simplifyGeometry(geometry, toleranceDeg) {
  if (!geometry?.coordinates) return geometry;
  const r = (pts) => pts.map(([x, y]) => [round5(x), round5(y)]);
  switch (geometry.type) {
    case 'LineString':
      return { type: 'LineString', coordinates: r(douglasPeucker(geometry.coordinates, toleranceDeg)) };
    case 'MultiLineString':
      return {
        type: 'MultiLineString',
        coordinates: geometry.coordinates.map((l) => r(douglasPeucker(l, toleranceDeg))),
      };
    case 'Polygon': {
      const rings = geometry.coordinates.map((ring) => simplifyRing(ring, toleranceDeg)).filter(Boolean).map(r);
      return rings.length ? { type: 'Polygon', coordinates: rings } : null;
    }
    case 'MultiPolygon': {
      const polys = geometry.coordinates
        .map((poly) => poly.map((ring) => simplifyRing(ring, toleranceDeg)).filter(Boolean).map(r))
        .filter((poly) => poly.length);
      return polys.length ? { type: 'MultiPolygon', coordinates: polys } : null;
    }
    default:
      return roundGeometry(geometry);
  }
}

/** Centroïde approché (moyenne des sommets de l'anneau extérieur d'un polygone). */
export function centroid(geometry) {
  if (!geometry) return null;
  let ring;
  if (geometry.type === 'Polygon') {
    ring = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    ring = geometry.coordinates[0]?.[0];
  } else {
    return null;
  }
  if (!ring?.length) return null;
  let x = 0;
  let y = 0;
  for (const [lon, lat] of ring) {
    x += lon;
    y += lat;
  }
  return [round5(x / ring.length), round5(y / ring.length)];
}

/**
 * Écrit une FeatureCollection en GeoJSON et renvoie un petit résumé
 * (nombre de features, taille du fichier en Ko) pour le log d'exécution.
 */
export async function writeCollection(outputPath, features) {
  const collection = { type: 'FeatureCollection', features };
  const json = JSON.stringify(collection);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, json);
  return { count: features.length, sizeKo: Math.round(json.length / 1024) };
}
