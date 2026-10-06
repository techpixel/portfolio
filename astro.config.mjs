// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import meta from './src/data/meta.json' with { type: 'json' };

import react from '@astrojs/react';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A preload for each island's script. The browser only learns of them once the page's own
 * script runs and the island asks for its component, two round trips after the HTML; a
 * modulepreload in the head puts them on the wire with the stylesheet (and Chrome fetches
 * their imports too), so the landing hydrates as soon as it can. Written into the built
 * pages, where the hashed URLs are known.
 * @returns {import('astro').AstroIntegration}
 */
const preloadIslands = () => ({
  name: 'preload-islands',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const pages = async (folder) =>
        (await Promise.all(
          (await readdir(folder, { withFileTypes: true })).map((entry) => {
            const path = join(folder, entry.name);
            return entry.isDirectory() ? pages(path) : entry.name.endsWith('.html') ? [path] : [];
          }),
        )).flat();
      for (const page of await pages(fileURLToPath(dir))) {
        const html = await readFile(page, 'utf8');
        const urls = new Set([...html.matchAll(/ (?:component|renderer)-url="([^"]+)"/g)].map((m) => m[1]));
        if (!urls.size) continue;
        const links = [...urls].map((url) => `<link rel="modulepreload" href="${url}">`).join('');
        await writeFile(page, html.replace('</head>', `${links}</head>`));
      }
    },
  },
});

// https://astro.build/config
export default defineConfig({
  site: meta.site.url,
  // Hovering a project row fetches its case study's HTML (links opt in with data-astro-prefetch).
  prefetch: true,

  // The site's two faces, fetched from Google at build time and served from here, so the
  // layout can preload the files and the first paint has them: Google's own stylesheet
  // was a render-blocking round trip on every load, and its files only came after it.
  // Both block (text waits for its face rather than first showing in a stand-in), and
  // the landing's loading screen holds until they're in. Case studies load their brand
  // specimens' faces from Google as before.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Schibsted Grotesk',
      cssVariable: '--font-schibsted',
      weights: ['400 700'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      display: 'block',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Familjen Grotesk',
      cssVariable: '--font-familjen',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'block',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
  ],

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

  integrations: [svelte(), react(), preloadIslands()],

  vite: {
    plugins: [tailwindcss()]
  }
});