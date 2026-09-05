import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://vistep.ai',
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/social/'),
      serialize(item) {
        const { pathname, origin } = new URL(item.url);
        const bare = pathname.replace(/^\/(en|zh)(?=\/|$)/, '') || '/';
        const home = bare === '/';
        item.links = [
          { lang: 'zh-CN', url: origin + (home ? '/zh/' : bare) },
          { lang: 'en', url: origin + (home ? '/en/' : '/en' + bare) },
          { lang: 'x-default', url: origin + (home ? '/' : '/en' + bare) },
        ];
        return item;
      },
    }),
  ],
  vite: { build: { chunkSizeWarningLimit: 650 } },
});
