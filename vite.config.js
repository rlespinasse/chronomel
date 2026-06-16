import { defineConfig } from 'vite';

// En production (GitHub Pages), le site est servi sous /chronomel/.
// En développement local, on sert depuis la racine.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/chronomel/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
