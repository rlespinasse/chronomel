import L from 'leaflet';
import 'leaflet-side-by-side';

import { createOrthoWmsLayer } from './wms.js';
import { principaux, parId } from './ortho-millesimes.js';
import { createTimelineControl } from './timeline-control.js';
import { createCompareControl } from './compare-control.js';

// Orchestrateur « chrono » branché dans le hook onReady de leaflet-atlas.
// Gère deux modes :
//   - timeline : une orthophoto affichée, pilotée par le curseur d'années ;
//   - compare  : deux orthophotos séparées par un rideau (leaflet-side-by-side).
// L'état (mode + millésimes sélectionnés) est persisté dans localStorage.

const STORAGE_KEY = 'chronomel:etat';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

export function initChrono(app) {
  const map = app.getMap();
  const annees = principaux();
  const recent = annees[annees.length - 1];
  const ancien = annees[0];

  const saved = loadState();
  const state = {
    mode: saved.mode === 'compare' ? 'compare' : 'timeline',
    currentId: parId(saved.currentId) ? saved.currentId : recent.id,
    leftId: parId(saved.leftId) ? saved.leftId : ancien.id,
    rightId: parId(saved.rightId) ? saved.rightId : recent.id,
  };

  // Couches WMS instanciées paresseusement puis mises en cache.
  const cache = new Map();
  const layerFor = (id) => {
    if (!cache.has(id)) cache.set(id, createOrthoWmsLayer(parId(id)));
    return cache.get(id);
  };

  let single = null;
  let sbs = null;

  function clearSingle() {
    if (single) {
      map.removeLayer(single);
      single = null;
    }
  }

  function clearCompare() {
    if (sbs) {
      map.removeControl(sbs);
      sbs = null;
    }
    [state.leftId, state.rightId].forEach((id) => {
      const layer = cache.get(id);
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
    });
  }

  function showSingle(id) {
    state.currentId = id;
    clearSingle();
    single = layerFor(id);
    single.addTo(map);
    saveState(state);
  }

  function showCompare() {
    const left = layerFor(state.leftId);
    const right = layerFor(state.rightId);
    left.addTo(map);
    right.addTo(map);
    sbs = L.control.sideBySide(left, right).addTo(map);
    saveState(state);
  }

  function setCompareLayer(side, millesime) {
    const key = side === 'left' ? 'leftId' : 'rightId';
    const oldId = state[key];
    const otherId = side === 'left' ? state.rightId : state.leftId;
    state[key] = millesime.id;

    if (oldId !== millesime.id && oldId !== otherId) {
      const old = cache.get(oldId);
      if (old && map.hasLayer(old)) map.removeLayer(old);
    }

    const layer = layerFor(millesime.id);
    layer.addTo(map);
    if (side === 'left') sbs.setLeftLayers(layer);
    else sbs.setRightLayers(layer);
    saveState(state);
  }

  const timeline = createTimelineControl({
    onSelect: (m) => showSingle(m.id),
  });

  const compare = createCompareControl({
    leftId: state.leftId,
    rightId: state.rightId,
    onChange: setCompareLayer,
  });

  // Bouton de bascule entre les deux modes (en haut à droite).
  let toggleButtons = {};
  const ModeToggle = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const c = L.DomUtil.create('div', 'chrono-panel chrono-modes leaflet-bar');
      L.DomEvent.disableClickPropagation(c);
      c.innerHTML = `
        <button type="button" class="chrono-mode" data-mode="timeline">Frise chronologique</button>
        <button type="button" class="chrono-mode" data-mode="compare">Comparer</button>
      `;
      c.querySelectorAll('.chrono-mode').forEach((btn) => {
        toggleButtons[btn.dataset.mode] = btn;
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
      });
      return c;
    },
  });

  function refreshToggleUI() {
    Object.entries(toggleButtons).forEach(([mode, btn]) => {
      btn.classList.toggle('is-active', mode === state.mode);
    });
  }

  function setMode(mode) {
    state.mode = mode === 'compare' ? 'compare' : 'timeline';
    if (state.mode === 'timeline') {
      clearCompare();
      map.removeControl(compare);
      timeline.addTo(map);
      timeline.selectById(state.currentId);
      showSingle(state.currentId);
    } else {
      clearSingle();
      map.removeControl(timeline);
      compare.addTo(map);
      compare.selectSides(state.leftId, state.rightId);
      showCompare();
    }
    refreshToggleUI();
    saveState(state);
  }

  new ModeToggle().addTo(map);
  setMode(state.mode);

  // --- Raccourcis clavier propres à ChronoMEL ---------------------------------
  // (les raccourcis natifs de leaflet-atlas restent inchangés)

  const dernierIndex = annees.length - 1;

  const isTypingTarget = (e) => {
    const el = e.target;
    return (
      el &&
      (el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        el.isContentEditable)
    );
  };

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingTarget(e)) return;

    // Bascule de mode : disponible dans les deux modes.
    if (e.key === 'm' || e.key === 'M') {
      setMode(state.mode === 'timeline' ? 'compare' : 'timeline');
      e.preventDefault();
      return;
    }

    // Les raccourcis suivants ne valent qu'en mode frise.
    if (state.mode !== 'timeline') return;

    switch (e.key) {
      case ',':
      case '<':
        timeline.step(-1);
        e.preventDefault();
        break;
      case '.':
      case '>':
        timeline.step(1);
        e.preventDefault();
        break;
      case 'Home':
        timeline.goToIndex(0);
        e.preventDefault();
        break;
      case 'End':
        timeline.goToIndex(dernierIndex);
        e.preventDefault();
        break;
      case 'v':
      case 'V':
        timeline.cycleVariant(1);
        e.preventDefault();
        break;
      default:
        break;
    }
  });

  // Rend les raccourcis ChronoMEL découvrables dans l'overlay d'aide « ? »
  // natif de leaflet-atlas (créé à la construction, donc présent ici).
  injectHelpRows();
}

function injectHelpRows() {
  const table = document.querySelector('.help-overlay .help-card table');
  if (!table) return;
  const rows = [
    ['<', 'Millésime précédent'],
    ['>', 'Millésime suivant'],
    ['Début', 'Premier millésime (1930)'],
    ['Fin', 'Dernier millésime (2025)'],
    ['V', 'Variante suivante de l’année'],
    ['M', 'Basculer frise / comparateur'],
  ];
  for (const [key, label] of rows) {
    const tr = document.createElement('tr');
    const tdKey = document.createElement('td');
    const kbd = document.createElement('kbd');
    kbd.textContent = key;
    tdKey.appendChild(kbd);
    const tdDesc = document.createElement('td');
    tdDesc.textContent = label;
    tr.appendChild(tdKey);
    tr.appendChild(tdDesc);
    table.appendChild(tr);
  }
}
