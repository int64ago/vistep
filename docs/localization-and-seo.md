# Localization and search

[简体中文](zh-CN/localization-and-seo.md) · [Documentation](README.md)

## Default-language decision

The neutral entry `/` resolves a language locally before painting the hero, then uses `location.replace` to open `/zh/` or `/en/`, retaining the query and fragment. An explicit request and a saved manual choice have precedence; the remaining signals contribute to a combined score rather than a strict fallback chain:

| Signal                        | Treatment                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `?lang=zh` or `?lang=en`      | Explicit request; highest precedence                                         |
| Saved manual choice           | `localStorage['vistep:language']`; precedes inferred signals                 |
| Ordered `navigator.languages` | Weighted by preference order; regional variants do not get duplicate votes   |
| `navigator.language`          | Fallback browser preference when not already represented                     |
| `Intl` format locale          | Supporting format-locale evidence                                            |
| Same-origin referring page    | Weak continuity signal from an existing Chinese or English page              |
| Time zone                     | Weak regional hint only; cannot overrule a clear browser language preference |
| No useful evidence / tie      | English                                                                      |

No IP lookup, geolocation permission, fingerprint or third-party language service is used. Missing storage or Intl support does not prevent loading. An inferred choice is not written as a permanent preference. The language switch saves an explicit choice and retains the same topic and fragment.

English home is `/en/`; Chinese home is `/zh/`. Existing Chinese `/explore/<slug>/` routes remain valid; English uses `/en/explore/<slug>/`. Explicit locale routes never redirect based on device settings. Root HTML offers a readable English fallback without JavaScript and links to both versions.

## Build-time search metadata

The neutral entry, localized homepages and topic pages have self-referencing canonical URLs, reciprocal `zh-CN` and `en` links, an `x-default` link, language metadata, Open Graph and Twitter metadata, and a 1200 × 630 PNG social card. Topic titles and descriptions come from their localized registry entries. The neutral entry shares its English fallback title and description with `/en/`; it is not a separate article.

Homepage `x-default` points to `/`; topic `x-default` points to the English topic. `/404.html` is a bilingual error document with a noindex meta tag and no structured data, not an indexable content route. The main metadata and schema sources are `src/layouts/Base.astro` and `src/data/seo.ts`; `astro.config.mjs` applies the sitemap's matching language links and excludes social-image endpoints.

The shared schema emits a website and collection on homepages; explanations use `LearningResource`, `BreadcrumbList`, chapter links and an `AudioObject` with the matching transcript. Interactive canvas scenes are not falsely marked as videos. Structured data describes visible content and does not guarantee a Google rich result.

Articles and chapter transcripts are prerendered. Each transcript links back to a seekable `#t=seconds` position. Captions remain concise; the full spoken explanation is available without running an experiment.

Astro regenerates routes and the sitemap on every build. Registered topics and their translations supply metadata, language alternatives, schema and social cards. We do not publish an artificial daily `lastmod`, change frequency or priority. Search Console has read the stable sitemap URL, so ordinary pushes need no repeated submission. Reading the map does not establish indexing or search visibility; see the dated status in [Search Console operations](search-console.md).

Production is indexable. Preview assets use `X-Robots-Tag: noindex, nofollow`; crawlers are allowed to fetch that header. Preview robots.txt has no sitemap advertisement, though the sitemap files and HTML link remain. Unknown URLs return an actual 404 with noindex. Preview and production have separate build directories and Workers, and both builds retain production canonical URLs.

Search Console is separate from all-traffic analytics. Cloudflare injects the production Web Analytics beacon at delivery; no Google Analytics or Google Tag Manager snippet is configured in the layout. Visitor-report entry points and metric boundaries are documented in [deployment](deployment.md#visitor-analytics-and-search).

## Verification

`pnpm audit:build` checks canonical URLs, sitemap coverage, alternate targets, descriptions, social PNG dimensions, structured data, transcript counts and internal assets. Language tests cover conflicting preferences, unsupported languages, duplicate regional variants and fallback behavior. Browser review covers persistence and first paint.

See [Search Console operations](search-console.md). Follow Google's guidance on [localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) and [structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).
