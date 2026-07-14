import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/chronomel/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
}));
