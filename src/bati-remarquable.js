// Métadonnées du « bâti remarquable daté » (BD TOPO IGN), style des marqueurs et
// logique de projection temporelle. Le catalogue de points est statique
// (public/data/bati-remarquable.geojson, régénéré par
// scripts/refresh-bati-remarquable.mjs) et déclaré comme couche leaflet-atlas
// (voir atlas-config.js) ; ce module décrit les usages, calcule l'état d'un
// bâtiment vis-à-vis du millésime affiché et fournit le style correspondant.

/** Usages BD TOPO retenus → libellé + couleur de marqueur. */
export const USAGES_BATI = {
  religieux: { label: 'Religieux', color: '#c084fc' },
  sportif: { label: 'Sportif', color: '#34d399' },
  industriel: { label: 'Industriel', color: '#fb923c' },
  patrimoine: { label: 'Patrimoine', color: '#f472b6' },
  autre: { label: 'Autre', color: '#94a3b8' },
};

/** Métadonnées d'un usage (avec repli sur « autre »). */
export function usageMeta(categorie) {
  return USAGES_BATI[categorie] ?? USAGES_BATI.autre;
}

/**
 * État d'un bâtiment vis-à-vis d'une année affichée :
 *   - 'present' : le bâtiment existait déjà (année ≥ apparition) ;
 *   - 'projete' : pas encore construit (année < apparition).
 * (La BD TOPO ne portant pas de date de démolition, l'état « disparu »
 * n'existe pas — voir README.)
 */
export function etatAuMillesime(feature, annee) {
  return annee >= feature.properties.annee ? 'present' : 'projete';
}

/** Style Leaflet d'un marqueur (circleMarker) selon son état au millésime. */
export function styleForFeature(feature, annee) {
  const { color } = usageMeta(feature.properties.categorie);
  if (etatAuMillesime(feature, annee) === 'present') {
    return {
      radius: 5,
      color,
      weight: 1,
      opacity: 1,
      fillColor: color,
      fillOpacity: 0.85,
      dashArray: null,
    };
  }
  // « projeté » : pas encore construit à ce millésime.
  return {
    radius: 4,
    color,
    weight: 1,
    opacity: 0.5,
    fillColor: color,
    fillOpacity: 0,
    dashArray: '2,2',
  };
}

// Millésime affiché courant, partagé avec le panneau de détail de leaflet-atlas
// (atlas-config.js) qui ne reçoit que les propriétés d'une feature, pas l'année.
let millesimeAffiche = null;

/** Mémorise le millésime affiché (appelé par l'orchestrateur chrono). */
export function setMillesimeAffiche(annee) {
  millesimeAffiche = annee;
}

/** Millésime affiché courant (null tant qu'aucun n'a été sélectionné). */
export function getMillesimeAffiche() {
  return millesimeAffiche;
}
