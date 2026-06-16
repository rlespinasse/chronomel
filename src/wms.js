import L from 'leaflet';

// Service WMS GeoServer de la Métropole Européenne de Lille (atelier Raster).
// Le service répond en EPSG:3857 par reprojection à la volée (vérifié), ce qui
// permet de l'utiliser directement comme couche tuilée Leaflet.
export const WMS_BASE = 'https://mel-geoserver.lillemetropole.fr/geoserver/Raster/wms';

export const ATTRIBUTION =
  'Orthophotographies © <a href="https://www.data.gouv.fr/organizations/metropole-europeenne-de-lille/" target="_blank" rel="noopener">Métropole Européenne de Lille</a> — Licence Ouverte';

// z-index des orthophotos : au-dessus du fond de carte (tilePane par défaut)
// mais sous les couches vectorielles de repère (overlayPane).
const ORTHO_Z_INDEX = 250;

/**
 * Crée une couche WMS Leaflet pour un millésime donné.
 * @param {import('./ortho-millesimes.js').Millesime} millesime
 * @returns {L.TileLayer.WMS}
 */
export function createOrthoWmsLayer(millesime) {
  const layer = L.tileLayer.wms(WMS_BASE, {
    layers: millesime.layer,
    format: 'image/jpeg',
    version: '1.3.0',
    transparent: false,
    tiled: true,
    maxZoom: 21,
    attribution: ATTRIBUTION,
  });
  layer.setZIndex(ORTHO_Z_INDEX);
  return layer;
}
