/** Internal handoff helper for parallel scene production.
 * Validates all packets before changing shared registries. Does not generate speech or publish.
 * Run without --apply to inspect a proposed integration; packet files remain until review finishes.
 */
import { readFile, writeFile, access } from 'node:fs/promises';
import { relative, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2),
  apply = args.includes('--apply');
const slugs = args.filter((value) => value !== '--apply');
if (!slugs.length || slugs.some((slug) => !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)))
  throw new Error('Supply one or more scene slugs; --apply is optional.');
if (new Set(slugs).size !== slugs.length) throw new Error('Duplicate requested slug.');
const paths = {
  topics: 'src/data/topics.ts',
  engines: 'src/data/experiments.ts',
  cover: 'src/components/TopicCover.astro',
  translations: 'src/i18n/en.json',
  narration: 'src/data/narration.json',
  discovery: 'src/data/discovery-metadata.ts',
  variants: 'src/data/curriculum-variants.json',
  timeline: 'src/data/film-timeline.json',
};
const source = Object.fromEntries(
  await Promise.all(
    Object.entries(paths).map(async ([key, path]) => [
      key,
      await readFile(resolve(root, path), 'utf8'),
    ]),
  ),
);
const original = { ...source };
const categoryIds = new Set(
  [...source.discovery.matchAll(/\bid:\s*['"]([a-z-]+)['"]/g)].map((match) => match[1]),
);
const translations = JSON.parse(source.translations),
  narration = JSON.parse(source.narration);
const variants = JSON.parse(source.variants);
const timeline = JSON.parse(source.timeline);
const available = new Set([...Object.keys(narration), ...slugs]);
let nextNumber =
  Math.max(
    ...[...source.topics.matchAll(/['"]?number['"]?:\s*['"](\d+)['"]/g)].map((match) =>
      Number(match[1]),
    ),
  ) + 1;
if (!Number.isFinite(nextNumber)) throw new Error('Could not determine the next scene number.');
const checks = [],
  additions = [];
const mustExist = async (path, pattern) => {
  if (
    typeof path !== 'string' ||
    !pattern.test(path) ||
    relative(root, resolve(root, path)).startsWith('..')
  )
    throw new Error(`Unexpected integration path: ${path}`);
  await access(resolve(root, path));
};
const prepend = (text, anchor, addition) => {
  if (text.split(anchor).length !== 2)
    throw new Error(`Expected one integration anchor: ${anchor}`);
  return text.replace(anchor, anchor + addition);
};
for (const slug of slugs) {
  const packet = JSON.parse(
    await readFile(resolve(root, `src/data/scene-packets/${slug}.json`), 'utf8'),
  );
  const topic = packet.topic;
  if (!topic || topic.slug !== slug || 'number' in topic)
    throw new Error(`${slug}: invalid topic identity or preassigned number.`);
  if (narration[slug] || new RegExp(`['"]?slug['"]?:\\s*['"]${slug}['"]`).test(source.topics))
    throw new Error(`${slug} is already registered; do not overwrite measured recordings.`);
  for (const key of ['name', 'title', 'question', 'description', 'color', 'tag'])
    if (typeof topic[key] !== 'string' || !topic[key].trim())
      throw new Error(`${slug}: missing ${key}.`);
  const discovery = packet.discovery;
  if (
    !discovery ||
    !categoryIds.has(discovery.category) ||
    ![8, 10, 12, 14].includes(discovery.minAge)
  )
    throw new Error(
      `${slug}: a current discovery category and editorial starting age are required.`,
    );
  for (const locale of ['zh', 'en']) {
    const words = discovery.keywords?.[locale];
    if (
      !Array.isArray(words) ||
      words.length < 3 ||
      words.some((word) => typeof word !== 'string' || !word.trim() || word !== word.trim()) ||
      new Set(words.map((word) => word.normalize('NFKC').toLowerCase())).size !== words.length
    )
      throw new Error(`${slug}: discovery needs at least three distinct ${locale} search aliases.`);
  }
  if (
    !discovery.keywords.zh.includes(topic.name) ||
    !discovery.keywords.en.includes(packet.translations?.[topic.name])
  )
    throw new Error(
      `${slug}: discovery aliases must include the exact Chinese and English topic names.`,
    );
  if (!Array.isArray(topic.related) || !Array.isArray(topic.sources) || !topic.sources.length)
    throw new Error(`${slug}: related topics and sources are required.`);
  if (
    new Set(topic.related).size !== topic.related.length ||
    topic.related.some((item) => item === slug || !available.has(item))
  )
    throw new Error(`${slug}: related topics must be distinct registered or same-batch topics.`);
  for (const reference of topic.sources)
    if (!reference.title || new URL(reference.url).protocol !== 'https:')
      throw new Error(`${slug}: invalid technical source.`);
  await mustExist(packet.component, /^src\/components\/experiments\/[A-Za-z][A-Za-z0-9]*\.tsx$/);
  await mustExist(packet.cover, /^src\/components\/covers\/[A-Za-z][A-Za-z0-9]*\.astro$/);
  for (const path of [`src/content/${slug}.mdx`, `src/content/en/${slug}.mdx`]) {
    const mdx = await readFile(resolve(root, path), 'utf8');
    for (const anchor of ['understand', 'try', 'deeper'])
      if (!mdx.includes(`id="${anchor}"`)) throw new Error(`${path}: missing ${anchor} anchor.`);
  }
  const film = packet.narration;
  if (
    !film ||
    !Array.isArray(film.cues) ||
    film.cues.length < 2 ||
    !Number.isFinite(film.duration) ||
    film.duration <= 0 ||
    film.duration > 300
  )
    throw new Error(`${slug}: invalid planned film.`);
  if (!packet.translations || typeof packet.translations !== 'object')
    throw new Error(`${slug}: missing translations.`);
  const words = { ...packet.translations };
  for (const [id, variant] of Object.entries(packet.curriculumVariants ?? {})) {
    const indices = variant.chapterIds?.map((chapterId) =>
      film.cues.findIndex((cue) => cue.id === chapterId),
    );
    if (!indices?.length || indices.some((n, i) => n < 0 || (i && n !== indices[i - 1] + 1)))
      throw new Error(`${slug}/${id}: curriculum chapters must exist in consecutive order.`);
    if (variants[id] && variants[id].sceneSlug !== slug)
      throw new Error(`${id}: a different scene already owns this textbook entry.`);
    variants[id] = { sceneSlug: slug, chapterIds: variant.chapterIds, label: variant.label };
  }
  if (new Set(film.cues.map((cue) => cue.id)).size !== film.cues.length)
    throw new Error(`${slug}: duplicate chapter identity.`);
  film.cues.forEach((cue, i) => {
    for (const key of ['id', 'title', 'titleEn', 'caption', 'captionEn', 'zh', 'en'])
      if (typeof cue[key] !== 'string' || !cue[key].trim())
        throw new Error(`${slug}/${i}: missing ${key}.`);
    if (
      !Number.isFinite(cue.seconds) ||
      !Number.isFinite(cue.chapterAt) ||
      !Number.isFinite(cue.at) ||
      cue.seconds < 1 ||
      cue.chapterAt < 0 ||
      cue.chapterAt >= film.duration ||
      cue.at >= film.duration ||
      cue.at < cue.chapterAt ||
      (i === 0 ? cue.chapterAt !== 0 : cue.chapterAt <= film.cues[i - 1].chapterAt)
    )
      throw new Error(`${slug}/${i}: invalid chapter timing.`);
    words[cue.title] = cue.titleEn;
    words[cue.caption] = cue.captionEn;
  });
  for (const [key, value] of Object.entries(words)) {
    if (typeof value !== 'string' || !value)
      throw new Error(`${slug}: invalid translation for ${key}.`);
    if (key in translations && translations[key] !== value)
      checks.push(
        `${slug}: existing translation differs for ${JSON.stringify(key)}: ${JSON.stringify(translations[key])} / ${JSON.stringify(value)}`,
      );
    else translations[key] = value;
  }
  // Classification lives only in discovery-metadata.ts; ignore older packet copies.
  delete topic.category;
  delete topic.duration;
  topic.number = String(nextNumber++);
  source.topics = prepend(
    source.topics,
    'export const topics: Topic[] = [\n',
    `${JSON.stringify(topic, null, 2)},\n`,
  );
  const componentPath = '../' + packet.component.replace(/^src\//, '').replace(/\.tsx$/, '');
  source.engines = prepend(
    source.engines,
    'export const experimentLoaders = {\n',
    `${JSON.stringify(slug)}: () => import(${JSON.stringify(componentPath)}),\n`,
  );
  const coverName = basename(packet.cover, '.astro');
  if (!source.cover.startsWith('---\n')) throw new Error('Cover frontmatter is missing.');
  source.cover = source.cover.replace(
    /^---\n/,
    `---\nimport ${coverName} from './covers/${coverName}.astro';\n`,
  );
  // A nested SVG keeps the supplied 400×230 cover self-contained within the existing SVG viewport.
  // Existing background rectangles precede each topic's original artwork.
  const newCover = `{slug === ${JSON.stringify(slug)} && <${coverName} color={color} />}`;
  const end = source.cover.lastIndexOf('</svg>');
  if (end < 0) throw new Error('Could not find the cover viewport.');
  source.cover = source.cover.slice(0, end) + newCover + '\n' + source.cover.slice(end);
  narration[slug] = film;
  // Planned windows allow visual direction before voices are frozen. Synthesis replaces them
  // with the measured bilingual windows; audio-contract checks still require real recordings.
  timeline[slug] = {
    duration: film.duration,
    chapters: film.cues.map((cue) => ({
      id: cue.id,
      title: cue.title,
      titleEn: cue.titleEn,
      caption: cue.caption,
      captionEn: cue.captionEn,
      at: cue.chapterAt,
    })),
  };
  source.discovery = prepend(
    source.discovery,
    'export const discoveryMetadata: Record<string, DiscoveryMetadata> = {\n',
    `${JSON.stringify(slug)}: ${JSON.stringify(discovery, null, 2)},\n`,
  );
  additions.push(`${topic.number}: ${slug} (${film.cues.length} planned chapters)`);
}
if (checks.length)
  throw new Error('Resolve translation conflicts before integration:\n' + checks.join('\n'));
source.translations = JSON.stringify(translations, null, 2) + '\n';
source.narration = JSON.stringify(narration, null, 2) + '\n';
source.variants = JSON.stringify(variants, null, 2) + '\n';
source.timeline = JSON.stringify(timeline, null, 2) + '\n';
console.log(additions.join('\n'));
if (!apply) {
  console.log('Validation only; no shared files changed.');
  process.exit(0);
}
// Catch a worker or editor changing any shared source during validation.
for (const [key, path] of Object.entries(paths))
  if ((await readFile(resolve(root, path), 'utf8')) !== original[key])
    throw new Error(`${path} changed during validation; retry after review.`);
for (const [key, path] of Object.entries(paths)) await writeFile(resolve(root, path), source[key]);
console.log(
  'Integrated shared sources and discovery metadata. Measured catalogs, incoming relations, recorded speech, review and builds are still required.',
);
