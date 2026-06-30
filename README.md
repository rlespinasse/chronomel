<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="ChronoMEL" />
</p>

<h1 align="center">ChronoMEL</h1>

Visionneuse temporelle des **orthophotographies de la Métropole Européenne de
Lille** (MEL). Naviguez dans le temps de **1930 à 2025** et comparez deux
millésimes côte à côte grâce à un rideau interactif.

> Carte construite avec [leaflet-atlas](https://github.com/rlespinasse/leaflet-atlas),
> publiée sur GitHub Pages — <https://www.romainlespinasse.dev/chronomel/>.

## Fonctionnalités

- **Frise chronologique** : un curseur pour parcourir les millésimes.
- **Variantes par année** : infrarouge colorisé (IRC), stéréoscopique, sans
  dévers, périmètre CCPC… proposées quand elles existent.
- **Comparateur à rideau** : confrontez deux millésimes avec un séparateur
  glissant (comparateur « maison », sans dépendance).
- **Repère vectoriel** : contour des 95 communes de la MEL, avec recherche par
  nom / code INSEE et panneau de détail (population, superficie, densité…).
- **Bâti remarquable daté** : couche optionnelle de ~1 200 bâtiments (religieux,
  sportifs, industriels et **patrimoine** — châteaux, forts, donjons, arcs)
  issus de la BD TOPO, *projetés dans le temps* — un bâtiment apparaît « pas
  encore construit » sur les millésimes antérieurs à son année de construction
  (certains châteaux remontent à 1402), puis « présent » ensuite.
- **Calques de contexte** : repères statiques activables pour lire le territoire
  — réseau ferré (métro VAL, tramway, train), hydrographie (cours d'eau, canaux),
  espaces verts (≥ 2 ha) et équipements structurants (santé, enseignement,
  administratif, transport, sport, culture), avec recherche des équipements par nom.
- **Persistance** : mode et millésimes sélectionnés conservés entre les visites.

> Cette documentation suit la méthode [Diátaxis](https://diataxis.fr/) : chaque
> grande section ci-dessous a une seule orientation (apprendre, faire, consulter,
> comprendre).

---

## Prise en main *(tutoriel — apprendre)*

Dans ce tutoriel, nous allons lancer ChronoMEL en local et réaliser une première
comparaison de millésimes.

1. **Cloner et installer** :

   ```bash
   git clone https://github.com/rlespinasse/chronomel.git
   cd chronomel
   npm install
   ```

2. **Démarrer le serveur de développement** :

   ```bash
   npm run dev
   ```

   Ouvrez l'adresse affichée (par défaut <http://localhost:5173>). La carte
   s'ouvre sur l'orthophoto **2025** de la métropole, avec le contour des
   communes en blanc.

3. **Voyager dans le temps** : déplacez le curseur « Millésime » (en bas à
   gauche) vers la gauche. L'image bascule sur des prises de vue plus anciennes,
   jusqu'à la vue aérienne de **1930**.

4. **Comparer deux époques** : cliquez sur **Comparer** (en haut à droite),
   choisissez `1930` à gauche et `2025` à droite, puis faites glisser le
   séparateur au centre de la carte.

Vous avez parcouru près d'un siècle d'évolution urbaine de la métropole. La
suite — déployer, ajouter un millésime — est décrite dans les guides ci-dessous.

---

## Guides pratiques *(how-to — faire)*

### Rafraîchir les données

Plusieurs jeux de données sont figés dans `public/data/` :

```bash
npm run refresh-data         # contour des communes (API OGC Features de la MEL)
npm run refresh-bati         # bâti remarquable daté (BD TOPO, WFS Géoplateforme)
npm run refresh-transport    # réseau ferré (métro, tram, train)   — BD TOPO
npm run refresh-hydro        # cours d'eau + surfaces hydrographiques — BD TOPO
npm run refresh-vegetation   # espaces verts (≥ 2 ha)                — BD TOPO
npm run refresh-equipements  # équipements structurants              — BD TOPO
```

En CI, le workflow `.github/workflows/refresh-data.yml` exécute ces commandes le
1er de chaque mois et ouvre une pull request si un fichier a changé. Les couches
BD TOPO partagent l'utilitaire de pagination WFS `scripts/lib/bdtopo.mjs`
(filtrage par emprise MEL, simplification et arrondi des géométries pour des
fichiers légers).

### Ajouter un nouveau millésime

1. Récupérez le nom exact de la couche dans le `GetCapabilities` du service WMS
   (voir [Sources de données](#sources-de-données--points-daccès)).
2. Ajoutez une entrée au tableau `MILLESIMES` de `src/ortho-millesimes.js`
   (`id`, `annee`, `layer`, `libelle`, `categorie`, `principal`, `resolution`).
3. Lancez `npm run dev` : le curseur et les sélecteurs du comparateur prennent
   la nouvelle entrée en compte automatiquement.

### Déployer sur GitHub Pages

Le déploiement est automatique à chaque push sur `main`
(`.github/workflows/deploy.yml`). Une seule action manuelle est requise, une
fois : dans **Settings → Pages** du dépôt, choisir la source **« GitHub
Actions »**. Le site est ensuite publié sur
<https://www.romainlespinasse.dev/chronomel/>.

---

## Référence *(consulter)*

### Commandes

| Commande | `just` | Effet |
| --- | --- | --- |
| `npm install` | — | Installe les dépendances |
| `npm run dev` | `just dev` | Serveur de développement (port 5173) |
| `npm run lint` | `just lint` | Analyse ESLint |
| `npm run build` | `just build` | Build de production dans `dist/` |
| `npm run refresh-data` | `just refresh-data` | Met à jour le GeoJSON des communes |
| `npm run refresh-bati` | — | Met à jour le GeoJSON du bâti remarquable (BD TOPO) |
| `npm run refresh-transport` | — | Met à jour le réseau ferré (BD TOPO) |
| `npm run refresh-hydro` | — | Met à jour l'hydrographie (BD TOPO) |
| `npm run refresh-vegetation` | — | Met à jour les espaces verts (BD TOPO) |
| `npm run refresh-equipements` | — | Met à jour les équipements structurants (BD TOPO) |

### Structure du code

| Fichier | Rôle |
| --- | --- |
| `src/main.js` | Point d'entrée, instancie `MapApp`. |
| `src/atlas-config.js` | Configuration leaflet-atlas (carte, communes, mentions légales, `onReady`). |
| `src/ortho-millesimes.js` | Catalogue des couches WMS par millésime. |
| `src/wms.js` | Fabrique de couches WMS Leaflet. |
| `src/chrono.js` | Orchestrateur des modes frise / comparaison. |
| `src/timeline-control.js` | Contrôle « frise chronologique ». |
| `src/compare-control.js` | Contrôle « comparateur ». |
| `src/bati-remarquable.js` | Métadonnées des usages, style et projection temporelle du bâti. |
| `scripts/lib/bdtopo.mjs` | Utilitaire WFS BD TOPO partagé (pagination, emprise, simplification/arrondi, centroïde, aire). |
| `scripts/refresh-data.mjs` | Téléchargement du contour des communes. |
| `scripts/refresh-bati-remarquable.mjs` | Téléchargement du bâti remarquable et patrimonial (BD TOPO). |
| `scripts/refresh-transport.mjs` | Téléchargement du réseau ferré (BD TOPO). |
| `scripts/refresh-hydro.mjs` | Téléchargement de l'hydrographie (BD TOPO). |
| `scripts/refresh-vegetation.mjs` | Téléchargement des espaces verts (BD TOPO). |
| `scripts/refresh-equipements.mjs` | Téléchargement des équipements structurants (BD TOPO). |

### Millésimes disponibles

Définis dans `src/ortho-millesimes.js`. Millésimes principaux : 1930, 1950,
1960, 1983, 1994, 1997, 2004, 2006, 2011, 2016, 2018, 2020, 2021, 2022, 2025.
Variantes : infrarouge (2011), sans dévers (2016), CCPC et stéréoscopique
(2020).

### Sources de données & points d'accès

Toutes les données proviennent de la Métropole Européenne de Lille via
[data.gouv.fr](https://www.data.gouv.fr/organizations/metropole-europeenne-de-lille/),
sous **Licence Ouverte**.

| Donnée | Format | Point d'accès |
| --- | --- | --- |
| Orthophotographies | WMS (atelier `Raster`) | `https://mel-geoserver.lillemetropole.fr/geoserver/Raster/wms` |
| Communes | OGC API Features | `https://data.lillemetropole.fr/geoserver/ogc/features/v1/collections/mel_limite_administrative:mel_comm_orga/items` |
| Bâti remarquable | WFS (`BDTOPO_V3:batiment`) | `https://data.geopf.fr/wfs/ows` — BD TOPO® © IGN |
| Réseau ferré | WFS (`BDTOPO_V3:troncon_de_voie_ferree`) | `https://data.geopf.fr/wfs/ows` — BD TOPO® © IGN |
| Hydrographie | WFS (`BDTOPO_V3:cours_d_eau`, `:surface_hydrographique`) | `https://data.geopf.fr/wfs/ows` — BD TOPO® © IGN |
| Espaces verts | WFS (`BDTOPO_V3:zone_de_vegetation`) | `https://data.geopf.fr/wfs/ows` — BD TOPO® © IGN |
| Équipements | WFS (`BDTOPO_V3:zone_d_activite_ou_d_interet`) | `https://data.geopf.fr/wfs/ows` — BD TOPO® © IGN |
| Fond de carte | Tuiles XYZ | OpenStreetMap (ODbL) |

### Stack technique

- [Vite](https://vite.dev/) — outillage et build statique.
- [Leaflet](https://leafletjs.com/) + [leaflet-atlas](https://github.com/rlespinasse/leaflet-atlas) — carte config-driven.
- Comparateur à rideau : contrôle « maison » sans dépendance (`src/swipe-control.js`).

---

## Comprendre le projet *(explication — comprendre)*

### Carte config-driven et orthophotos en `onReady`

leaflet-atlas est piloté par configuration et orienté GeoJSON : ses fonds de
carte (`baseLayers`) n'acceptent que des tuiles XYZ, pas de WMS. Les
orthophotos étant servies en WMS, elles ne pouvaient pas être déclarées comme
fonds classiques. ChronoMEL les ajoute donc dans le hook `onReady` (voir
`src/chrono.js`), où l'on dispose de l'instance Leaflet pour créer des couches
`L.tileLayer.wms` et brancher les contrôles temporels. Le fond vectoriel des
communes, lui, satisfait la contrainte d'au moins un `layerGroups` tout en
apportant la recherche et le panneau de détail « gratuitement ».

### Pourquoi la reprojection EPSG:3857 fonctionne

Le service WMS ne déclare officiellement que les systèmes EPSG:2154 (Lambert-93)
et CRS:84, alors que Leaflet travaille en EPSG:3857 (Web Mercator). Plutôt que
de basculer toute la carte en Lambert-93 (proj4leaflet), nous nous appuyons sur
le fait que le GeoServer **reprojette à la volée** : une requête `GetMap` en
`EPSG:3857` renvoie bien une image. Les orthophotos sont donc consommables comme
des couches WMS Leaflet standard, sans dépendance supplémentaire.

### Bâti remarquable : couche config-driven, mais restylée dynamiquement

Le bâti remarquable réutilise au maximum leaflet-atlas : il est déclaré comme une
couche `layerGroups` ordinaire (avec son `style`, son `tooltips` et son
`detailBuilders`), ce qui lui offre « gratuitement » la case d'activation, la
pastille de légende, le tooltip et le panneau de détail — exactement comme les
communes. La seule chose que le modèle *config-driven* ne sait pas faire est un
style qui dépend d'un état externe : ici, le millésime affiché. On récupère donc
l'instance Leaflet via `app.getAllLayerDefs()` et on la restyle à chaque
changement de millésime (`syncBati` dans `src/chrono.js`), au lieu de
réimplémenter une couche et des contrôles à la main.

### Projection temporelle du bâti, mais pas de « disparu »

Le bâti remarquable est *projeté* dans le temps grâce au champ `date_d_apparition`
de la BD TOPO : on connaît l'année de construction, donc on peut afficher un
bâtiment comme « pas encore là » sur les millésimes antérieurs. En revanche, la
BD TOPO **ne porte aucune date de démolition** (les bâtiments disparus sont
retirés du jeu, pas historisés) — et aucun jeu open data géolocalisé ne la
fournit. L'état « disparu » (par ex. une maternité visible en 1982 mais détruite
depuis) n'est donc volontairement pas implémenté : il aurait exigé une saisie
manuelle. On ne projette le bâti que dans le sens « apparition ».

### Calques de contexte : pourquoi statiques

Le réseau ferré, l'hydrographie, les espaces verts et les équipements
proviennent de la BD TOPO, comme le bâti, mais **aucune de ces couches ne porte
de date d'apparition exploitable** (seuls les `batiment` en ont). On ne peut donc
pas les projeter dans le temps : elles sont affichées telles quelles, comme
repères permanents, et ne réagissent pas au millésime. C'est aussi pourquoi les
« équipements » (écoles, hôpitaux, mairies, gares) sont une couche statique et
non un enrichissement temporel du bâti — la BD TOPO ne les date pas, et leur
classement (`usage_1` des bâtiments) ne distingue pas ces fonctions. Le seul
enrichissement *temporel* possible était patrimonial : châteaux, forts, donjons
et arcs, qui eux portent une date (parfois très ancienne) et rejoignent donc la
couche datée du bâti remarquable.

Côté implémentation, ces couches sont 100 % *config-driven* (déclarées dans
`src/atlas-config.js` via `layerGroups` / `styles` / `tooltips` / `detailBuilders`)
et n'ont demandé **aucune** modification de l'orchestrateur `src/chrono.js` :
elles n'ont pas d'état temporel à synchroniser. Pour rester légères au
téléchargement (leaflet-atlas charge tous les fichiers au démarrage), leurs
géométries sont simplifiées (Douglas-Peucker) et filtrées par taille à la
génération — voir `scripts/lib/bdtopo.mjs`.

### Deux modes de lecture du temps

Le « chrono » se décline en deux usages complémentaires : la **frise** (une
seule orthophoto à la fois, idéale pour balayer les époques) et le
**comparateur** à rideau (deux millésimes confrontés sur la même vue, idéal
pour mesurer une transformation précise). L'état (mode et millésimes choisis)
est conservé en `localStorage` afin de ne pas perturber la gestion du *hash*
d'URL propre à leaflet-atlas.

---

## Licence

Code sous licence MIT. Données © Métropole Européenne de Lille et BD TOPO® ©
IGN — Licence Ouverte. Voir les **mentions légales** accessibles depuis la carte
pour le détail des sources et de la confidentialité.
