import { createAnalytics } from 'leaflet-atlas';

// Mesure d'audience GoatCounter (compte personnel « rlespinasse »).
//
// `basePath` préfixe TOUS les événements par « /chronomel » — le compte
// GoatCounter peut héberger plusieurs projets, ce préfixe les cloisonne. Les
// vues de page portent déjà ce préfixe (le site est servi sous /chronomel/ sur
// GitHub Pages, cf. vite.config.js).
//
// Cette config est partagée entre deux émetteurs d'événements :
//   - leaflet-atlas, via `config.analytics` (atlas-config.js) : il émet seul les
//     événements natifs (couche activée, recherche, zoom, panneau, légal…) ;
//   - les contrôles propres à ChronoMEL (bascule de mode, millésime,
//     comparateur), via `trackEvent` ci-dessous.
//
// Les hits depuis localhost sont ignorés (garde `isLocalhost` de leaflet-atlas
// + comportement par défaut de count.js, `allow_local` non activé).
export const analyticsConfig = {
  provider: 'goatcounter',
  basePath: '/chronomel/',
};

const analytics = createAnalytics(analyticsConfig);

export const trackEvent = (path, title) => analytics.trackEvent(path, title);
