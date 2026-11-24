import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths make the built website usable on GitHub Pages and inside Capacitor.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
