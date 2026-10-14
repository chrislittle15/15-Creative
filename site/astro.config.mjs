// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';

// Dev only: serve public/<folder>/index.html at /<folder>/ (Netlify and `astro build` already do this).
/** @type {import('vite').Plugin} */
const publicIndexPages = {
  name: 'public-index-pages',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = (req.url || '').split('?')[0];
      if (url.endsWith('/') && url !== '/') {
        const file = path.join(process.cwd(), 'public', url, 'index.html');
        if (fs.existsSync(file)) req.url = url + 'index.html';
      }
      next();
    });
  },
};

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [publicIndexPages],
    server: {
      // Local development only: Efficiency Finder runs from its own repo (npm run dev on :8888).
      // At launch its build is copied into public/efficiency-finder/ and this proxy is unused.
      proxy: { "/efficiency-finder": "http://localhost:8888" },
    },
  },
});
