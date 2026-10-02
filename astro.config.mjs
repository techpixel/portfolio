// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import meta from './src/data/meta.json' with { type: 'json' };

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: meta.site.url,

  integrations: [svelte(), react()],

  vite: {
    plugins: [tailwindcss()]
  }
});