import { films } from './films';
import narration from './narration.json';
import tracks from './audio-tracks.json';
import { topics, type Topic } from './topics';
import { localPath, localizedTopic, type Locale } from '../i18n';
export const siteOrigin = 'https://vistep.ai';
const url = (path: string) => new URL(path, siteOrigin).href;
export const structuredJSON = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
export function pageSchema(path: string, locale: Locale, source?: Topic) {
  const language = locale === 'zh' ? 'zh-CN' : 'en';
  const website = {
    '@type': 'WebSite',
    '@id': url('/#website'),
    name: 'vistep.ai',
    alternateName: 'Visualize Every Step with AI',
    url: siteOrigin,
    inLanguage: ['en', 'zh-CN'],
  };
  const publisher = {
    '@type': 'Organization',
    '@id': url('/#publisher'),
    name: 'vistep.ai',
    url: siteOrigin,
  };
  if (!source)
    return {
      '@context': 'https://schema.org',
      '@graph': [
        website,
        publisher,
        {
          '@type': 'CollectionPage',
          '@id': url(path),
          url: url(path),
          name: locale === 'en' ? 'Visual explanations — vistep.ai' : '原理可视化 — vistep.ai',
          inLanguage: language,
          isPartOf: { '@id': url('/#website') },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: topics.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: localizedTopic(t, locale).name,
              url: url(localPath(`/explore/${t.slug}/`, locale)),
            })),
          },
        },
      ],
    };
  const topic = localizedTopic(source, locale),
    film = films[topic.slug];
  const script = narration[topic.slug as keyof typeof narration],
    audio = tracks[topic.slug as keyof typeof tracks][locale];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      website,
      publisher,
      {
        '@type': 'LearningResource',
        '@id': url(path + '#resource'),
        url: url(path),
        name: topic.name,
        headline: topic.title,
        description: topic.description,
        inLanguage: language,
        learningResourceType: 'Interactive visual explanation',
        educationalUse: 'Self-directed learning',
        isAccessibleForFree: true,
        timeRequired: `PT${film.duration}S`,
        image: url(`/social/${topic.slug}.png`),
        publisher: { '@id': url('/#publisher') },
        isPartOf: { '@id': url('/#website') },
        citation: topic.sources.map((s) => s.url),
        audio: {
          '@type': 'AudioObject',
          name: topic.name,
          contentUrl: url(audio.src),
          encodingFormat: 'audio/mpeg',
          duration: `PT${film.duration}S`,
          inLanguage: language,
          transcript: script.cues.map((c) => c[locale]).join('\n\n'),
        },
        hasPart: film.chapters.map((c) => ({
          '@type': 'CreativeWork',
          name: locale === 'zh' ? c.title : c.titleEn,
          description: locale === 'zh' ? c.caption : c.captionEn,
          url: url(`${path}#t=${c.at}`),
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'vistep.ai',
            item: url(localPath('/', locale)),
          },
          { '@type': 'ListItem', position: 2, name: topic.name, item: url(path) },
        ],
      },
    ],
  };
}
