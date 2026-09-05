import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://vistep.ai',
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  integrations: [react(), mdx(), sitemap()],
  vite: { build: { chunkSizeWarningLimit: 650 } },
});
