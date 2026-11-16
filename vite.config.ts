import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// GitHub Pages serves the repo at /Balance/
export default defineConfig({
  base: '/Balance/',
  plugins: [svelte()],
});
