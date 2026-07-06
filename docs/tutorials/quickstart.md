# Quick Start (5 minutes)

Get ChronoMEL running locally in 5 minutes.

## Prerequisites

- Node.js 18+ and npm
- Git
- A terminal

## Steps

### 1. Clone and Install (1 min)

```bash
git clone https://github.com/rlespinasse/chronomel.git
cd chronomel
npm install
```

### 2. Start Development Server (1 min)

```bash
npm run dev
```

Opens http://localhost:5173 with the interactive temporal orthophoto viewer.

### 3. Explore the Timeline (2 min)

- **Timeline control** (bottom) — Drag to jump between years (1930-2025)
- **Comparison mode** (top) — Swipe left/right to compare two years
- **Layers panel** (right) — Toggle historical buildings, infrastructure, green spaces
- **Search** (top) — Find communes by name or INSEE code
- **Click features** — View details about selected communes, buildings, etc.

### 4. Build for Production (1 min)

```bash
npm run build
```

Output is in `dist/` — ready for GitHub Pages deployment.

## What You're Looking At

- **Orthophotographies** — Aerial imagery (1930-2025) from Métropole Européenne de Lille
- **Historical layers** — Buildings dated by construction year, showing the territory's growth
- **Context layers** — Rail networks, water features, green spaces
- **Timeline** — Click any year to jump to that orthophoto vintage

## Next Steps

- **Add your own layer?** → See [Add a Layer](../how-to/add-layer.md)
- **Configure timeline behavior?** → See [Configure Timeline](../how-to/configure-timeline.md)
- **Deploy to GitHub Pages?** → See [Deploy](../how-to/deploy-to-github-pages.md)
- **Understand the architecture?** → See [Architecture](../explanation/architecture.md)

---

For detailed guides, see the [documentation index](../README.md).
