import { initChrono } from './chrono.js';

const nf = new Intl.NumberFormat('fr-FR');

const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );

// Configuration de l'application leaflet-atlas.
// Le fond vectoriel « communes » satisfait le layerGroups requis et apporte la
// recherche + le panneau de détail. Les orthophotographies WMS et leurs
// contrôles temporels sont ajoutés dans onReady (voir chrono.js).
export const config = {
  map: {
    elementId: 'map',
    center: [50.63, 3.06], // Lille
    zoom: 11,
    zoomSnap: 0.25,
  },

  title: {
    heading: 'ChronoMEL',
    subtitle: 'Orthophotographies de la Métropole Européenne de Lille',
    icon: 'logo.svg',
  },

  baseLayers: {
    'Plan OpenStreetMap': {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      },
    },
  },
  defaultBaseLayer: 'Plan OpenStreetMap',

  layerGroups: [
    {
      group: 'Repères',
      layers: [
        {
          id: 'communes',
          label: 'Communes de la MEL',
          file: 'data/communes-mel.geojson',
          active: true,
        },
      ],
    },
  ],

  styles: {
    communes: {
      color: '#ffffff',
      weight: 1,
      opacity: 0.9,
      fill: true,
      fillOpacity: 0, // remplissage invisible mais cliquable
    },
  },

  searchableProps: {
    communes: {
      title: (p) => p.nom,
      meta: (p) => `${nf.format(p.population)} hab. · ${p.surface_km2} km²`,
      text: ['nom', 'code_insee', 'libelle_ut'],
    },
  },

  tooltips: {
    communes: (p) => p.nom,
  },

  detailBuilders: () => ({
    communes: (p) => `
      <h2>${escapeHtml(p.nom)}</h2>
      <dl class="commune-detail">
        <dt>Code INSEE</dt><dd>${escapeHtml(p.code_insee)}</dd>
        <dt>Population</dt><dd>${nf.format(p.population)} hab.</dd>
        <dt>Superficie</dt><dd>${escapeHtml(p.surface_km2)} km²</dd>
        <dt>Densité</dt><dd>${nf.format(p.densite_pop_km2)} hab./km²</dd>
        <dt>Unité territoriale</dt><dd>${escapeHtml(p.libelle_ut)}</dd>
        <dt>Territoire</dt><dd>${escapeHtml(p.libelle_territoire_gouvernance)}</dd>
      </dl>
      <p class="detail-source">
        Source :
        <a href="https://www.data.gouv.fr/datasets/communes-de-la-metropole-europeenne-de-lille/" target="_blank" rel="noopener">
          Communes de la MEL — data.gouv.fr
        </a>
      </p>`,
  }),

  legalPages: [
    {
      id: 'mentions',
      label: 'Mentions légales',
      content: `
        <h2>Mentions légales</h2>
        <h3>Éditeur</h3>
        <p>ChronoMEL est un projet personnel et open source édité par Romain Lespinasse.</p>
        <p>
          Code source et contact&nbsp;:
          <a href="https://github.com/rlespinasse/chronomel" target="_blank" rel="noopener">github.com/rlespinasse/chronomel</a>
          (signalements via les <em>issues</em> du dépôt).
        </p>
        <h3>Hébergement</h3>
        <p>
          Site hébergé par GitHub&nbsp;Pages — GitHub,&nbsp;Inc.,
          88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.
        </p>
        <h3>Propriété intellectuelle</h3>
        <p>
          Le code de ChronoMEL est distribué sous licence MIT. Les orthophotographies et
          données affichées restent la propriété de leurs producteurs respectifs
          (voir l'onglet «&nbsp;Données &amp; licences&nbsp;»).
        </p>`,
    },
    {
      id: 'donnees',
      label: 'Données & licences',
      content: `
        <h2>Données &amp; licences</h2>
        <h3>Orthophotographies</h3>
        <p>
          © <a href="https://www.data.gouv.fr/organizations/metropole-europeenne-de-lille/" target="_blank" rel="noopener">Métropole Européenne de Lille</a>,
          diffusées sur data.gouv.fr sous
          <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" target="_blank" rel="noopener">Licence Ouverte 2.0 (Etalab)</a>.
          Diffusion via le service WMS du GeoServer métropolitain.
        </p>
        <h3>Communes</h3>
        <p>
          Contour des communes&nbsp;: jeu de données «&nbsp;Communes de la Métropole Européenne de Lille&nbsp;»
          (<a href="https://www.data.gouv.fr/datasets/communes-de-la-metropole-europeenne-de-lille/" target="_blank" rel="noopener">data.gouv.fr</a>, Licence Ouverte).
        </p>
        <h3>Fond cartographique</h3>
        <p>
          © les contributeurs
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>,
          sous licence ODbL.
        </p>
        <h3>Cartographie</h3>
        <p>
          Réalisée avec <a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a>
          et <a href="https://github.com/rlespinasse/leaflet-atlas" target="_blank" rel="noopener">leaflet-atlas</a>
          (comparateur à rideau intégré).
        </p>`,
    },
    {
      id: 'confidentialite',
      label: 'Confidentialité',
      content: `
        <h2>Confidentialité</h2>
        <p>
          ChronoMEL est un site statique qui ne collecte aucune donnée personnelle,
          n'utilise aucun cookie et n'embarque aucun outil de mesure d'audience.
        </p>
        <p>
          Vos préférences d'affichage (mode et millésimes sélectionnés) sont enregistrées
          localement dans votre navigateur (<em>localStorage</em>) et ne sont jamais transmises.
        </p>
        <p>
          L'affichage de la carte nécessite des requêtes vers des serveurs tiers
          (GeoServer de la MEL, tuiles OpenStreetMap) susceptibles de journaliser votre
          adresse IP selon leurs propres politiques de confidentialité.
        </p>`,
    },
  ],

  onReady: (app) => initChrono(app),
};
