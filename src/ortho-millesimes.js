// Catalogue des orthophotographies de la MEL servies en WMS par le GeoServer
// métropolitain. Chaque entrée correspond à une couche WMS (`layer`).
//
// - `principal: true`  → millésime « de référence » affiché sur la timeline
//   (un par année).
// - les autres entrées sont des variantes d'une même année (infrarouge,
//   stéréoscopique, sans dévers, périmètre CCPC…), accessibles ponctuellement.
//
// Noms de couches vérifiés via le GetCapabilities du service :
// https://mel-geoserver.lillemetropole.fr/geoserver/Raster/ows?service=WMS&version=1.3.0&request=GetCapabilities

export const CATEGORIES = {
  standard: 'Standard',
  irc: 'Infrarouge (IRC)',
  stereo: 'Stéréoscopique',
  'sans-devers': 'Sans dévers',
  ccpc: 'CCPC',
};

/** @typedef {{ id: string, annee: number, layer: string, libelle: string,
 *  categorie: keyof typeof CATEGORIES, principal: boolean, resolution?: string }} Millesime */

/** @type {Millesime[]} */
export const MILLESIMES = [
  { id: '1930_ortho', annee: 1930, layer: '1930_ortho', libelle: 'Ortho 1930', categorie: 'standard', principal: true },
  { id: '1950_ortho', annee: 1950, layer: '1950_ortho', libelle: 'Ortho 1950', categorie: 'standard', principal: true },
  { id: '1960_ortho', annee: 1960, layer: '1960_ortho', libelle: 'Ortho 1960', categorie: 'standard', principal: true },
  { id: '1983_ortho', annee: 1983, layer: '1983_ortho', libelle: 'Ortho 1983', categorie: 'standard', principal: true },
  { id: '1994_ortho', annee: 1994, layer: '1994_ortho', libelle: 'Ortho 1994', categorie: 'standard', principal: true },
  { id: '1997_ortho', annee: 1997, layer: '1997_ortho', libelle: 'Ortho 1997', categorie: 'standard', principal: true },
  { id: '2004_ortho', annee: 2004, layer: '2004_ortho', libelle: 'Ortho 2004', categorie: 'standard', principal: true },
  { id: '2006_ortho', annee: 2006, layer: '2006_ortho', libelle: 'Ortho 2006', categorie: 'standard', principal: true },
  { id: '2011_ortho', annee: 2011, layer: '2011_ortho', libelle: 'Ortho 2011', categorie: 'standard', principal: true },
  { id: '2011_ortho_irc', annee: 2011, layer: '2011_ortho_irc', libelle: 'Ortho 2011 — infrarouge colorisé', categorie: 'irc', principal: false },
  { id: '2016_orthomel_5cm', annee: 2016, layer: '2016_orthomel_5cm', libelle: 'Ortho 2016 MEL', categorie: 'standard', principal: true, resolution: '5 cm' },
  { id: '2016_trueorthomel_7cm', annee: 2016, layer: '2016_trueorthomel_7cm', libelle: 'Ortho 2016 MEL (sans dévers)', categorie: 'sans-devers', principal: false, resolution: '7 cm' },
  { id: '2018_ortho_ppige', annee: 2018, layer: '2018_ortho_ppige', libelle: 'Ortho 2018 PPIGE', categorie: 'standard', principal: true, resolution: '20 cm' },
  { id: '2020_ortho_mel_5cm', annee: 2020, layer: '2020_ortho_mel_5cm', libelle: 'Ortho 2020 MEL', categorie: 'standard', principal: true, resolution: '5 cm' },
  { id: '2020_ortho_ccpc_5cm', annee: 2020, layer: '2020_ortho_ccpc_5cm', libelle: 'Ortho 2020 CCPC', categorie: 'ccpc', principal: false, resolution: '5 cm' },
  { id: '2020_ortho_stereo_mel_5cm', annee: 2020, layer: '2020_ortho_stereo_mel_5cm', libelle: 'Ortho 2020 MEL (stéréoscopique)', categorie: 'stereo', principal: false, resolution: '5 cm' },
  { id: '2021_ortho_ign_20cm', annee: 2021, layer: '2021_ortho_ign_20cm', libelle: 'Ortho 2021 IGN', categorie: 'standard', principal: true, resolution: '20 cm' },
  { id: '2022_ortho_mel_5cm', annee: 2022, layer: '2022_ortho_mel_5cm', libelle: 'Ortho 2022 MEL', categorie: 'standard', principal: true, resolution: '5 cm' },
  { id: '2025_ortho_mel_5cm', annee: 2025, layer: '2025_ortho_mel_5cm', libelle: 'Ortho 2025 MEL (hiver)', categorie: 'standard', principal: true, resolution: '5 cm' },
];

/** Millésimes principaux, un par année, triés chronologiquement. */
export function principaux() {
  return MILLESIMES.filter((m) => m.principal).sort((a, b) => a.annee - b.annee);
}

/** Variantes (non principales) disponibles pour une année donnée. */
export function variantesPour(annee) {
  return MILLESIMES.filter((m) => m.annee === annee && !m.principal);
}

/** Toutes les entrées d'une année (principal en tête). */
export function pourAnnee(annee) {
  return MILLESIMES.filter((m) => m.annee === annee).sort((a, b) => Number(b.principal) - Number(a.principal));
}

/** Retrouve un millésime par son identifiant. */
export function parId(id) {
  return MILLESIMES.find((m) => m.id === id) || null;
}

/** Libellé court pour l'affichage (ex. « 2020 · Standard · 5 cm »). */
export function libelleCourt(m) {
  const parts = [String(m.annee), CATEGORIES[m.categorie]];
  if (m.resolution) parts.push(m.resolution);
  return parts.join(' · ');
}
