import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import reactRenderer from '@astrojs/react/server.js';
import { Resvg } from '@resvg/resvg-js';
import { resolve } from 'node:path';
import TopicCover from '../../components/TopicCover.astro';
import { rasterCoverSlugs } from '../../data/raster-covers';
import { getTopic } from '../../data/topics';

export function getStaticPaths() {
  return rasterCoverSlugs.map((slug) => ({ params: { slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/react', renderer: reactRenderer });
  const topic = getTopic(params.slug!);
  const svg = await container.renderToString(TopicCover, {
    props: { slug: topic.slug, color: topic.color },
  });
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 800 },
    font: {
      fontFiles: ['Manrope.ttf', 'ManropeGreek.ttf', 'NotoArrow.ttf', 'NotoScientific.ttf'].map(
        (name) => resolve('scripts/assets', name),
      ),
      loadSystemFonts: false,
      defaultFontFamily: 'Manrope',
    },
  })
    .render()
    .asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
