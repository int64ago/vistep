import { topics } from './topics';

/** Every catalog cover is its own lazy image. Geometry stays in TopicCover;
 * filtering 102 cards never inserts their meshes and SVG nodes into the page.
 */
export const rasterCoverSlugs = topics.map((topic) => topic.slug);
