<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="ChronoMEL" />
</p>

<h1 align="center">ChronoMEL</h1>

Visionneuse temporelle des **orthophotographies de la Métropole Européenne de
Lille** (MEL). Naviguez dans le temps de **1930 à 2025** et comparez deux
millésimes côte à côte grâce à un rideau interactif.

> Carte construite avec [leaflet-atlas](https://github.com/rlespinasse/leaflet-atlas),
> publiée sur GitHub Pages — <https://rlespinasse.github.io/chronomel/>.

## Fonctionnalités

- **Frise chronologique** : un curseur pour parcourir les millésimes.
- **Variantes par année** : infrarouge colorisé (IRC), stéréoscopique, sans
  dévers, périmètre CCPC… proposées quand elles existent.
- **Comparateur à rideau** : confrontez deux millésimes avec un séparateur
  glissant (basé sur `leaflet-side-by-side`).
- **Repère vectoriel** : contour des 95 communes de la MEL, avec recherche par
  nom / code INSEE et panneau de détail (population, superficie, densité…).
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

### Rafraîchir les données des communes

Le contour des communes est figé dans `public/data/communes-mel.geojson`. Pour
le régénérer depuis l'API de la MEL :

```bash
npm run refresh-data
```

En CI, le workflow `.github/workflows/refresh-data.yml` exécute cette commande le
1er de chaque mois et ouvre une pull request si le fichier a changé.

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
<https://rlespinasse.github.io/chronomel/>.

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
| `scripts/refresh-data.mjs` | Téléchargement du contour des communes. |

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
| Fond de carte | Tuiles XYZ | OpenStreetMap (ODbL) |

### Stack technique

- [Vite](https://vite.dev/) — outillage et build statique.
- [Leaflet](https://leafletjs.com/) + [leaflet-atlas](https://github.com/rlespinasse/leaflet-atlas) — carte config-driven.
- [leaflet-side-by-side](https://github.com/digidem/leaflet-side-by-side) — comparateur à rideau.

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

### Deux modes de lecture du temps

Le « chrono » se décline en deux usages complémentaires : la **frise** (une
seule orthophoto à la fois, idéale pour balayer les époques) et le
**comparateur** à rideau (deux millésimes confrontés sur la même vue, idéal
pour mesurer une transformation précise). L'état (mode et millésimes choisis)
est conservé en `localStorage` afin de ne pas perturber la gestion du *hash*
d'URL propre à leaflet-atlas.

---

## Licence

Code sous licence MIT. Données © Métropole Européenne de Lille — Licence
Ouverte. Voir les **mentions légales** accessibles depuis la carte pour le
détail des sources et de la confidentialité.
