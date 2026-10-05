// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import meta from './src/data/meta.json' with { type: 'json' };

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: meta.site.url,
  // Hovering a project row fetches its case study's HTML (links opt in with data-astro-prefetch).
  prefetch: true,

  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        // Sharp's default AVIF quality (50) smears the small UI text in the heroes and
        // screenshots; 80 keeps it crisp at roughly the fallback WebP's size.
        avif: { quality: 80 },
      },
    },
  },

  integrations: [svelte(), react()],

  vite: {
    plugins: [tailwindcss()]
  }
});