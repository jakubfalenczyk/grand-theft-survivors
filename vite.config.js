import { translateMarkup } from './src/shared/intl/index.ts';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{ name: 'english-document', transformIndexHtml: translateMarkup }],
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  build: {
    rollupOptions: {
      input: { game: 'index.html', backlog: 'docs/backlog/index.html' },
      output: { manualChunks: { phaser: ['phaser'] } },
    },
    // Phaser is deliberately isolated for caching; do not hide its size warning.
  },
});
