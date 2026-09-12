import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Resvg } from '@resvg/resvg-js';
import TopicCover from '../../components/TopicCover.astro';
import { rasterCoverSlugs } from '../../data/raster-covers';

export function getStaticPaths() {
  return rasterCoverSlugs.map((slug) => ({ params: { slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const container = await AstroContainer.create();
  const svg = await container.renderToString(TopicCover, { props: { slug: params.slug } });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 800 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
