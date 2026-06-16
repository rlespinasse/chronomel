default: dev

# Lance le serveur de développement Vite
dev:
    npm run dev

# Construit le site statique dans dist/
build:
    npm run build

# Vérifie le code avec ESLint
lint:
    npm run lint

# Met à jour le GeoJSON des communes depuis l'API de la MEL
refresh-data:
    node scripts/refresh-data.mjs
