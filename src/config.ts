import { initChrono } from './chrono.js';
import { usageMeta, getMillesimeAffiche } from './bati-remarquable.js';
import { analyticsConfig } from './analytics.js';

const nf = new Intl.NumberFormat('fr-FR');

const TRANSPORT_LABELS: Record<string, string> = {
  metro: 'Métro',
  tramway: 'Tramway',
  ferre: 'Voie ferrée',
};

const EQUIP_LABELS: Record<string, string> = {
  sante: 'Santé',
  enseignement: 'Enseignement',
  administratif: 'Administratif / militaire',
  transport: 'Transport',
  sport: 'Sport',
  culture: 'Culture & loisirs',
  autre: 'Équipement',
};

const escapeHtml = (value?: string | number | null): string =>
  String(value ?? '').replace(
    /[&<>"]/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c as keyof Record<string, string>]
  );

export const config = {
  map: {
    elementId: 'map',
    center: [50.63, 3.06],
    zoom: 11,
    zoomSnap: 1,
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

  analytics: analyticsConfig,

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

  contextLayers: [
    {
      id: 'transport',
      label: 'Réseau ferré (métro, tram, train)',
      file: 'data/transport.geojson',
      active: false,
    },
    {
      id: 'hydroCours',
      label: "Cours d'eau",
      file: 'data/hydro-cours.geojson',
      active: false,
    },
    {
      id: 'hydroSurfaces',
      label: "Surfaces en eau (canaux, plans d'eau)",
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
      fillOpacity: 0,
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
    transport: {
      color: '#e11d48',
      weight: 2,
      opacity: 0.9,
    },
    hydroCours: {
      color: '#0ea5e9',
      weight: 1.5,
      opacity: 0.9,
    },
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
      radius: 4,
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
      title: (p: any) => p.nom,
      meta: (p: any) => `${nf.format(p.population)} hab. · ${p.surface_km2} km²`,
      text: ['nom', 'code_insee', 'libelle_ut'],
    },
    equipements: {
      title: (p: any) => p.nom,
      meta: (p: any) => EQUIP_LABELS[p.categorie] ?? 'Équipement',
      text: ['nom', 'nature'],
    },
  },

  tooltips: {
    communes: (p: any) => p.nom,
    bati: (p: any) => `${usageMeta(p.categorie).label} · ${p.annee}`,
    transport: (p: any) => TRANSPORT_LABELS[p.categorie] ?? p.nature ?? 'Voie ferrée',
    hydroCours: (p: any) => p.nom || p.nature || "Cours d'eau",
    hydroSurfaces: (p: any) => p.nom || p.nature || 'Surface en eau',
    vegetation: (p: any) => p.nature || 'Espace vert',
    equipements: (p: any) => p.nom || EQUIP_LABELS[p.categorie] || 'Équipement',
  },

  detailBuilders: () => ({
    communes: (p: any) => `
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
    bati: (p: any) => {
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
    transport: (p: any) => `
      <h2>${escapeHtml(TRANSPORT_LABELS[p.categorie] ?? 'Voie ferrée')}</h2>
      <dl class="commune-detail">
        <dt>Nature</dt><dd>${escapeHtml(p.nature)}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
    hydroCours: (p: any) => `
      <h2>${escapeHtml(p.nom || "Cours d'eau")}</h2>
      <dl class="commune-detail">
        <dt>Type</dt><dd>${escapeHtml(p.nature)}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
    hydroSurfaces: (p: any) => `
      <h2>${escapeHtml(p.nom || p.nature || 'Surface en eau')}</h2>
      <dl class="commune-detail">
        <dt>Type</dt><dd>${escapeHtml(p.nature)}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
    vegetation: (p: any) => `
      <h2>Espace vert</h2>
      <dl class="commune-detail">
        <dt>Nature</dt><dd>${escapeHtml(p.nature)}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
    equipements: (p: any) => `
      <h2>${escapeHtml(p.nom || EQUIP_LABELS[p.categorie] || 'Équipement')}</h2>
      <dl class="commune-detail">
        <dt>Catégorie</dt><dd>${escapeHtml(EQUIP_LABELS[p.categorie] ?? '—')}</dd>
        <dt>Type</dt><dd>${escapeHtml(p.nature ?? '—')}</dd>
      </dl>
      <p class="detail-source">Source : BD&nbsp;TOPO® © IGN</p>`,
  }),

  legalPages: [
    {
      id: 'about',
      label: 'À propos',
      content: `
        <h2>À propos</h2>
        <p>
          ChronoMEL est une visionneuse cartographique temporelle qui montre l'évolution du
          bâti et du territoire de la Métropole Européenne de Lille (MEL) de 1930 à 2025, à
          partir des orthophotographies aériennes successives.
        </p>
        <h3>Contenu visualisé</h3>
        <ul>
          <li>Limites administratives des communes de la MEL</li>
          <li>Bâti remarquable (religieux, sportif, industriel) daté, avec projection temporelle</li>
          <li>
            Contexte territorial&nbsp;: réseau ferré (métro, tramway, voie ferrée), hydrographie,
            espaces verts et équipements structurants
          </li>
        </ul>
        <h3>Comparateur à rideau</h3>
        <p>
          Un curseur permet de comparer côte à côte deux millésimes d'orthophotographies et
          d'observer directement les transformations urbaines survenues entre deux dates.
        </p>
        <h3>Mise à jour des données</h3>
        <p>
          Les jeux de données sont régénérés automatiquement chaque mois, le 1er du mois, à
          partir des sources ouvertes listées dans l'onglet «&nbsp;Données &amp;
          licences&nbsp;».
        </p>`,
    },
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
        </p>
        <h3>Fréquence de mise à jour</h3>
        <p>
          Toutes les couches ci-dessus sont régénérées automatiquement chaque mois, le
          1er du mois à 06h00 UTC, par un pipeline de traitement qui interroge les
          services WMS/OGC des producteurs de données.
        </p>`,
    },
    {
      id: 'confidentialite',
      label: 'Confidentialité',
      content: `
        <h2>Confidentialité</h2>
        <p>
          ChronoMEL est un site statique qui mesure son audience avec
          <a href="https://www.goatcounter.com/" target="_blank" rel="noopener">GoatCounter</a>,
          un outil respectueux de la vie privée&nbsp;: aucune donnée personnelle n'est
          collectée, aucun cookie n'est déposé et votre adresse IP n'est pas conservée.
          Les statistiques recueillies (vues de page, événements d'usage, navigateur,
          provenance) sont anonymes et agrégées. Les requêtes émises depuis un poste
          local de développement ne sont pas comptabilisées.
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
    {
      id: 'credits',
      label: 'Crédits',
      content: `
        <h2>Crédits</h2>
        <h3>Technologies</h3>
        <ul>
          <li><a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a> — cartographie interactive</li>
          <li><a href="https://github.com/rlespinasse/leaflet-atlas" target="_blank" rel="noopener">leaflet-atlas</a> — framework de configuration cartographique (recherche, panneaux, comparateur à rideau, analytics)</li>
          <li><a href="https://vitejs.dev/" target="_blank" rel="noopener">Vite</a> — build et serveur de développement</li>
          <li><a href="https://www.typescriptlang.org/" target="_blank" rel="noopener">TypeScript</a> — typage statique de la configuration</li>
        </ul>
        <h3>Données</h3>
        <p>Voir l'onglet «&nbsp;Données &amp; licences&nbsp;» pour le détail des sources et de leurs licences.</p>
        <h3>Code source</h3>
        <p>
          <a href="https://github.com/rlespinasse/chronomel" target="_blank" rel="noopener">github.com/rlespinasse/chronomel</a>
          — distribué sous licence MIT.
        </p>
        <h3>Auteur</h3>
        <p>Romain Lespinasse</p>`,
    },
  ],

  onReady: (app: any) => initChrono(app),
};
