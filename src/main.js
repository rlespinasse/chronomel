import 'leaflet/dist/leaflet.css';
import 'leaflet-atlas/css';
import './css/app.css';

import { MapApp } from 'leaflet-atlas';
import { config } from './config.js';

// Point d'entrée : instancie l'application cartographique leaflet-atlas.
// Toute la logique « chrono » (millésimes WMS, timeline, comparateur) est
// branchée via le hook onReady défini dans config.ts.
export const app = new MapApp(config);
