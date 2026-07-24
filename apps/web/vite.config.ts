import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On build, assets are served from the GitHub Pages project sub-path
// (https://tsevis.github.io/garauarmonie/). Dev keeps the root base.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/garauarmonie/' : '/',
  plugins: [react()],
  server: { port: 5180, open: false },
}));
