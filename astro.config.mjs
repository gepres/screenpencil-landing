// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Dominio público del sitio (para canonical, sitemap y OG).
// Cámbialo cuando tengas el dominio/URL final.
const SITE = process.env.SITE_URL || 'https://gepres.github.io';

// Base path. Para deploy en raíz (Vercel, Cloudflare Pages, dominio propio) déjalo en '/'.
// Para GitHub Pages de proyecto, ponlo en '/screenpencil-landing/' (o el nombre del repo).
// IMPORTANTE: se normaliza para que SIEMPRE termine en '/'. En CI, configure-pages da el
// base path SIN barra final (p. ej. '/screenpencil-landing'); sin esto, las rutas que
// concatenan `${BASE_URL}assets/...` quedarían pegadas ('/screenpencil-landingassets/...').
const RAW_BASE = process.env.BASE_PATH || '/';
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : RAW_BASE + '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()],
  },
});
