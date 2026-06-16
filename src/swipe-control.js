import L from 'leaflet';

// Rideau de comparaison « maison » (sans dépendance tierce).
//
// Deux couches sont superposées sur la carte ; un séparateur vertical
// déplaçable découpe (CSS `clip`) chaque couche pour n'en montrer qu'une moitié.
// Technique classique reposant sur `containerPointToLayerPoint` pour rester
// aligné lors des déplacements/zooms de la carte.
//
// Usage :
//   const rideau = new SwipeCurtain(map);
//   rideau.setLayers(coucheGauche, coucheDroite);
//   rideau.remove();

const THUMB_SIZE = 40; // px — pour aligner le trait sur la poignée

export class SwipeCurtain {
  constructor(map) {
    this._map = map;
    this._left = null;
    this._right = null;

    const parent = map.getContainer();
    this._container = L.DomUtil.create('div', 'swipe', parent);
    this._divider = L.DomUtil.create('div', 'swipe-divider', this._container);
    this._range = L.DomUtil.create('input', 'swipe-range', this._container);
    this._range.type = 'range';
    this._range.min = 0;
    this._range.max = 1;
    this._range.step = 'any';
    this._range.value = 0.5;
    this._range.setAttribute('aria-label', 'Position du séparateur de comparaison');

    this._onMove = this._update.bind(this);
    map.on('move', this._onMove);
    L.DomEvent.on(this._range, 'input change', this._update, this);
    // Évite que la carte se déplace pendant qu'on glisse la poignée.
    L.DomEvent.on(this._range, 'mousedown touchstart', this._disableMapDrag, this);
    L.DomEvent.on(this._range, 'mouseup touchend', this._enableMapDrag, this);
  }

  /** Définit (ou met à jour) les deux couches comparées et redessine le rideau. */
  setLayers(left, right) {
    this._left = left || null;
    this._right = right || null;
    this._update();
    return this;
  }

  /** Retire le rideau et restaure les couches (clip annulé). */
  remove() {
    this._clearClip(this._left);
    this._clearClip(this._right);
    if (this._map) this._map.off('move', this._onMove);
    L.DomUtil.remove(this._container);
    this._map = null;
  }

  _dividerX() {
    const value = Number(this._range.value);
    // Décalage pour que le trait suive le centre de la poignée.
    const offset = (0.5 - value) * THUMB_SIZE;
    return this._map.getSize().x * value + offset;
  }

  _clearClip(layer) {
    const c = layer && layer.getContainer && layer.getContainer();
    if (c) c.style.clip = '';
  }

  _update() {
    if (!this._map) return;
    const nw = this._map.containerPointToLayerPoint([0, 0]);
    const se = this._map.containerPointToLayerPoint(this._map.getSize());
    const dividerPx = this._dividerX();
    const clipX = nw.x + dividerPx;

    this._divider.style.left = `${dividerPx}px`;

    const leftRect = `rect(${nw.y}px, ${clipX}px, ${se.y}px, ${nw.x}px)`;
    const rightRect = `rect(${nw.y}px, ${se.x}px, ${se.y}px, ${clipX}px)`;
    const lc = this._left && this._left.getContainer && this._left.getContainer();
    const rc = this._right && this._right.getContainer && this._right.getContainer();
    if (lc) lc.style.clip = leftRect;
    if (rc) rc.style.clip = rightRect;
  }

  _disableMapDrag() {
    if (this._map && this._map.dragging.enabled()) this._map.dragging.disable();
  }

  _enableMapDrag() {
    if (this._map && !this._map.dragging.enabled()) this._map.dragging.enable();
  }
}
