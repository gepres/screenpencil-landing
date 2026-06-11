// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Dominio público del sitio (para canonical, sitemap y OG).
// Cámbialo cuando tengas el dominio/URL final.
const SITE = process.env.SITE_URL || 'https://gepres.github.io';

// Base path. Para deploy en raíz (Vercel, Cloudflare Pages, dominio propio) déjalo en '/'.
// Para GitHub Pages de proyecto, ponlo en '/screenpencil-landing/' (o el nombre del repo).
const BASE = process.env.BASE_PATH || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()],
  },
});
