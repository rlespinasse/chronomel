import L from 'leaflet';
import {
  principaux,
  pourAnnee,
  parId,
  libelleCourt,
  CATEGORIES,
} from './ortho-millesimes.js';

// Contrôle « timeline » : un curseur chronologique pour choisir l'année
// affichée, plus des pastilles de variantes (IRC, stéréo, sans dévers, CCPC)
// quand l'année sélectionnée en propose.
//
// Usage : createTimelineControl({ onSelect: (millesime) => { ... } })

const Timeline = L.Control.extend({
  options: { position: 'bottomleft' },

  initialize(options) {
    L.Util.setOptions(this, options);
    this._years = principaux();
    this._index = this._years.length - 1; // millésime le plus récent par défaut
    this._variantId = null;
  },

  onAdd() {
    const c = L.DomUtil.create('div', 'chrono-panel chrono-timeline');
    L.DomEvent.disableClickPropagation(c);
    L.DomEvent.disableScrollPropagation(c);

    c.innerHTML = `
      <div class="chrono-head">
        <span class="chrono-kicker">Millésime</span>
        <span class="chrono-year"></span>
        <span class="chrono-detail"></span>
      </div>
      <div class="chrono-slider-row">
        <button type="button" class="chrono-step" data-step="-1" aria-label="Millésime précédent ( , )" title="Millésime précédent ( , )">◀</button>
        <input type="range" class="chrono-slider" min="0" max="${this._years.length - 1}" step="1" aria-label="Curseur des millésimes" />
        <button type="button" class="chrono-step" data-step="1" aria-label="Millésime suivant ( . )" title="Millésime suivant ( . )">▶</button>
      </div>
      <div class="chrono-variants"></div>
    `;

    this._dom = {
      year: c.querySelector('.chrono-year'),
      detail: c.querySelector('.chrono-detail'),
      slider: c.querySelector('.chrono-slider'),
      variants: c.querySelector('.chrono-variants'),
    };

    this._dom.slider.addEventListener('input', () => {
      this._index = Number(this._dom.slider.value);
      this._variantId = null;
      this._update(true);
    });

    c.querySelectorAll('.chrono-step').forEach((btn) => {
      btn.addEventListener('click', () => this.step(Number(btn.dataset.step)));
    });

    this._update(false);
    return c;
  },

  _current() {
    return this._variantId ? parId(this._variantId) : this._years[this._index];
  },

  /** Décale le millésime courant de `delta` crans (borné), variante remise à zéro. */
  step(delta) {
    this.goToIndex(this._index + delta);
  },

  /** Positionne la frise sur l'index donné (borné), variante remise à zéro. */
  goToIndex(i) {
    this._index = Math.max(0, Math.min(this._years.length - 1, i));
    this._variantId = null;
    this._update(true);
  },

  /** Passe à la variante suivante de l'année courante (cyclique, principal inclus). */
  cycleVariant(dir = 1) {
    const entries = pourAnnee(this._years[this._index].annee);
    if (entries.length <= 1) return;
    const activeId = this._current().id;
    const at = entries.findIndex((m) => m.id === activeId);
    const next = entries[(at + dir + entries.length) % entries.length];
    this._variantId = next.principal ? null : next.id;
    this._update(true);
  },

  _renderVariants() {
    const annee = this._years[this._index].annee;
    const entries = pourAnnee(annee); // principal + variantes
    const box = this._dom.variants;
    box.innerHTML = '';
    box.classList.toggle('is-empty', entries.length <= 1);
    if (entries.length <= 1) return;

    const activeId = this._current().id;
    entries.forEach((m) => {
      const chip = L.DomUtil.create('button', 'chrono-chip', box);
      chip.type = 'button';
      chip.textContent = m.principal ? 'Standard' : CATEGORIES[m.categorie];
      chip.classList.toggle('is-active', m.id === activeId);
      chip.addEventListener('click', () => {
        this._variantId = m.principal ? null : m.id;
        this._update(true);
      });
    });
  },

  _update(fire) {
    const m = this._current();
    this._dom.slider.value = String(this._index);
    this._dom.year.textContent = String(this._years[this._index].annee);
    this._dom.detail.textContent = libelleCourt(m);
    this._renderVariants();
    if (fire && typeof this.options.onSelect === 'function') {
      this.options.onSelect(m);
    }
  },

  /** Positionne le contrôle sur un millésime donné, sans déclencher onSelect. */
  selectById(id) {
    const m = parId(id);
    if (!m) return;
    const idx = this._years.findIndex((y) => y.annee === m.annee);
    if (idx >= 0) this._index = idx;
    this._variantId = m.principal ? null : m.id;
    if (this._dom) this._update(false);
  },
});

export function createTimelineControl(options) {
  return new Timeline(options);
}
