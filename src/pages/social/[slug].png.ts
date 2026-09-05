import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Resvg } from '@resvg/resvg-js';
import { resolve } from 'node:path';
import CollectionCard from '../../components/CollectionCard.astro';
import SocialCard from '../../components/SocialCard.astro';
import { topics } from '../../data/topics';
export function getStaticPaths() {
  return ['home', 'collection', ...topics.map((t) => t.slug)].map((slug) => ({ params: { slug } }));
}
export const GET: APIRoute = async ({ params }) => {
  const container = await AstroContainer.create();
  const svg = await container.renderToString(
    params.slug === 'collection' ? CollectionCard : SocialCard,
    { props: { topic: topics.find((t) => t.slug === params.slug) } },
  );
  const png = new Resvg(svg, {
    font: {
      fontFiles: ['Manrope.ttf', 'ManropeGreek.ttf', 'NotoArrow.ttf'].map((name) =>
        resolve('scripts/assets', name),
      ),
      loadSystemFonts: false,
      defaultFontFamily: 'Manrope',
    },
  })
    .render()
    .asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
