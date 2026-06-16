import L from 'leaflet';
import { MILLESIMES, libelleCourt, parId } from './ortho-millesimes.js';

// Contrôle « comparateur » : deux listes déroulantes (gauche / droite) qui
// pilotent le rideau leaflet-side-by-side. Tous les millésimes (principaux et
// variantes) sont sélectionnables de chaque côté.
//
// Usage : createCompareControl({ leftId, rightId, onChange: (side, millesime) => {} })

function optionsHtml(selectedId) {
  return MILLESIMES.slice()
    .sort((a, b) => a.annee - b.annee || Number(b.principal) - Number(a.principal))
    .map(
      (m) =>
        `<option value="${m.id}"${m.id === selectedId ? ' selected' : ''}>${libelleCourt(m)}</option>`,
    )
    .join('');
}

const Compare = L.Control.extend({
  options: { position: 'bottomleft' },

  initialize(options) {
    L.Util.setOptions(this, options);
  },

  onAdd() {
    const c = L.DomUtil.create('div', 'chrono-panel chrono-compare');
    L.DomEvent.disableClickPropagation(c);
    L.DomEvent.disableScrollPropagation(c);

    c.innerHTML = `
      <div class="chrono-head">
        <span class="chrono-kicker">Comparer deux millésimes</span>
        <span class="chrono-detail">Glissez le séparateur sur la carte</span>
      </div>
      <label class="cmp-field">
        <span class="cmp-side cmp-side--left">Gauche</span>
        <select class="cmp-select cmp-left">${optionsHtml(this.options.leftId)}</select>
      </label>
      <label class="cmp-field">
        <span class="cmp-side cmp-side--right">Droite</span>
        <select class="cmp-select cmp-right">${optionsHtml(this.options.rightId)}</select>
      </label>
    `;

    this._left = c.querySelector('.cmp-left');
    this._right = c.querySelector('.cmp-right');

    this._left.addEventListener('change', () => this._emit('left', this._left.value));
    this._right.addEventListener('change', () => this._emit('right', this._right.value));

    return c;
  },

  _emit(side, id) {
    const m = parId(id);
    if (m && typeof this.options.onChange === 'function') {
      this.options.onChange(side, m);
    }
  },

  /** Positionne les deux côtés sans déclencher onChange. */
  selectSides(leftId, rightId) {
    if (this._left) this._left.value = leftId;
    if (this._right) this._right.value = rightId;
  },
});

export function createCompareControl(options) {
  return new Compare(options);
}
