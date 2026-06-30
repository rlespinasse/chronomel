import { initChrono } from './chrono.js';
import { usageMeta, getMillesimeAffiche } from './bati-remarquable.js';

const nf = new Intl.NumberFormat('fr-FR');

// Libellés lisibles des catégories des couches de contexte (le style des couches
// est unique ; la catégorie est restituée dans le tooltip et le panneau détail).
const TRANSPORT_LABELS = {
  metro: 'Métro',
  tramway: 'Tramway',
  ferre: 'Voie ferrée',
};

const EQUIP_LABELS = {
  sante: 'Santé',
  enseignement: 'Enseignement',
  administratif: 'Administratif / militaire',
  transport: 'Transport',
  sport: 'Sport',
  culture: 'Culture & loisirs',
  autre: 'Équipement',
};

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
        {
          // Couche optionnelle ; le style ci-dessous n'est qu'un gabarit
          // (le `radius` déclenche le rendu en circleMarker). La couleur réelle
          // par usage et l'état projeté/présent sont appliqués dynamiquement
          // selon le millésime affiché (voir syncBati dans chrono.js).
          id: 'bati',
          label: 'Bâti remarquable daté',
          file: 'data/bati-remarquable.geojson',
          active: false,
        },
        {
          id: 'equipements',
          label: 'Équipements structurants',
          file: 'data/equipements.geojson',
          active: false,
        },
      ],
    },
  ],

  // Calques de contexte statiques (BD TOPO® IGN) : repères permanents pour lire
  // le territoire. Contrairement au bâti, ces objets ne portent pas de date
  // exploitable — ils ne réagissent donc pas au millésime affiché.
  // Déclarés via `contextLayers` (et non un `layerGroups`) : leaflet-atlas rend
  // pour eux une section « Contexte » dédiée. Les passer aussi en layerGroup
  // dupliquerait cette section (une vide + une pleine).
  contextLayers: [
    {
      id: 'transport',
      label: 'Réseau ferré (métro, tram, train)',
      file: 'data/transport.geojson',
      active: false,
    },
    {
      id: 'hydroCours',
      label: 'Cours d’eau',
      file: 'data/hydro-cours.geojson',
      active: false,
    },
    {
      id: 'hydroSurfaces',
      label: 'Surfaces en eau (canaux, plans d’eau)',
      file: 'data/hydro-surfaces.geojson',
      active: false,
    },
    {
      id: 'vegetation',
      label: 'Espaces verts (≥ 2 ha)',
      file: 'data/vegetation.geojson',
      active: false,
    },
  ],

  // Type de géométrie de chaque couche. Indispensable : sans cette indication,
  // leaflet-atlas suppose « polygon » partout et calcule un pane (z-index) à
  // partir de l'aire des features. Or l'aire n'est définie que pour des
  // polygones — pour une couche purement points/lignes (bati, transport,
  // equipements), aucun pane n'est créé et la couche tombe dans l'overlayPane
  // par défaut (z-index 400), donc SOUS les polygones (communes au remplissage
  // invisible mais cliquable, vegetation…) qui captent alors les clics.
  // En déclarant le type, les points passent au-dessus (z 650), puis les lignes
  // (z 500), puis les polygones (selon l'aire) : la priorité de clic suit la
  // taille apparente. L'hydrographie est scindée en deux couches (cours d'eau
  // en lignes, surfaces en polygones) : un style unique « rempli » conviendrait
  // aux polygones mais refermerait les polylignes en une fausse surface.
  geometryTypes: {
    communes: 'polygon',
    bati: 'point',
    transport: 'line',
    hydroCours: 'line',
    hydroSurfaces: 'polygon',
    vegetation: 'polygon',
    equipements: 'point',
  },

  styles: {
    communes: {
      color: '#ffffff',
      weight: 1,
      opacity: 0.9,
      fill: true,
      fillOpacity: 0, // remplissage invisible mais cliquable
    },
    bati: {
      radius: 5,
      color: '#fb923c',
      weight: 1,
      opacity: 1,
      fill: true,
      fillColor: '#fb923c',
      fillOpacity: 0.85,
    },
    // Couches de contexte : un style unique par couche (cf. _processLayer de
    // leaflet-atlas, qui applique l'objet de style tel quel à toute la couche).
    transport: {
      color: '#e11d48',
      weight: 2,
      opacity: 0.9,
    },
    // Cours d'eau : lignes seules, surtout PAS de remplissage (sinon Leaflet
    // referme la polyligne et dessine une fausse surface).
    hydroCours: {
      color: '#0ea5e9',
      weight: 1.5,
      opacity: 0.9,
    },
    // Surfaces en eau : polygones remplis (et donc cliquables sur tout
    // l'intérieur, pas seulement sur le contour).
    hydroSurfaces: {
      color: '#0ea5e9',
      weight: 1.5,
      opacity: 0.9,
      fill: true,
      fillColor: '#38bdf8',
      fillOpacity: 0.3,
    },
    vegetation: {
      color: '#16a34a',
      weight: 0.5,
      opacity: 0.6,
      fill: true,
      fillColor: '#22c55e',
      fillOpacity: 0.35,
    },
    equipements: {
      radius: 4, // déclenche le rendu en circleMarker (points)
      color: '#475569',
      weight: 1,
      opacity: 1,
      fill: true,
      fillColor: '#94a3b8',
      fillOpacity: 0.85,
    },
  },

  searchableProps: {
    communes: {
      title: (p) => p.nom,
      meta: (p) => `${nf.format(p.population)} hab. · ${p.surface_km2} km²`,
      text: ['nom', 'code_insee', 'libelle_ut'],
    },
    equipements: {
      title: (p) => p.nom,
      meta: (p) => EQUIP_LABELS[p.categorie] ?? 'Équipement',
      text: ['nom', 'nature'],
    },
  },

  tooltips: {
    communes: (p) => p.nom,
    bati: (p) => `${usageMeta(p.categorie).label} · ${p.annee}`,
    transport: (p) => TRANSPORT_LABELS[p.categorie] ?? p.nature ?? 'Voie ferrée',
    hydroCours: (p) => p.nom || p.nature || 'Cours d’eau',
    hydroSurfaces: (p) => p.nom || p.nature || 'Surface en eau',
    vegetation: (p) => p.nature || 'Espace vert',
    equipements: (p) => p.nom || EQUIP_LABELS[p.categorie] || 'Équipement',
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
    bati: (p) => {
      const meta = usageMeta(p.categorie);
      const annee = getMillesimeAffiche();
      const etat =
        annee == null
          ? '—'
          : annee >= p.annee
            ? `Présent en ${annee}`
            : `Pas encore construit en ${annee}`;
      return `
      <h2 style="color:${meta.color}">${escapeHtml(meta.label)}</h2>
      <dl class="commune-detail">
        <dt>Nature</dt><dd>${escapeHtml(p.nature)}</dd>
        <dt>Apparition</dt><dd>${escapeHtml(p.annee)}</dd>
        <dt>État affiché</dt><dd>${escapeHtml(etat)}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`;
    },
    transport: (p) => `
      <h2>${escapeHtml(TRANSPORT_LABELS[p.categorie] ?? 'Voie ferrée')}</h2>
      <dl class="commune-detail">
        <dt>Nature</dt><dd>${escapeHtml(p.nature)}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
    hydroCours: (p) => `
      <h2>${escapeHtml(p.nom || 'Cours d’eau')}</h2>
      <dl class="commune-detail">
        <dt>Type</dt><dd>${escapeHtml(p.nature)}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
    hydroSurfaces: (p) => `
      <h2>${escapeHtml(p.nom || p.nature || 'Surface en eau')}</h2>
      <dl class="commune-detail">
        <dt>Type</dt><dd>${escapeHtml(p.nature)}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
    vegetation: (p) => `
      <h2>Espace vert</h2>
      <dl class="commune-detail">
        <dt>Nature</dt><dd>${escapeHtml(p.nature)}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
    equipements: (p) => `
      <h2>${escapeHtml(p.nom || EQUIP_LABELS[p.categorie] || 'Équipement')}</h2>
      <dl class="commune-detail">
        <dt>Catégorie</dt><dd>${escapeHtml(EQUIP_LABELS[p.categorie] ?? '—')}</dd>
        <dt>Type</dt><dd>${escapeHtml(p.nature ?? '—')}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
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
        <h3>Bâti remarquable</h3>
        <p>
          Bâtiments religieux, sportifs et industriels datés issus de la
          <a href="https://geoservices.ign.fr/bdtopo" target="_blank" rel="noopener">BD&nbsp;TOPO®</a>
          © <a href="https://www.ign.fr/" target="_blank" rel="noopener">IGN</a>, diffusée via la Géoplateforme
          sous <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" target="_blank" rel="noopener">Licence Ouverte 2.0 (Etalab)</a>.
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
