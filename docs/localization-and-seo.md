# Localization and search

[简体中文](zh-CN/localization-and-seo.md) · [Documentation](README.md)

## Default-language decision

The neutral entry `/` resolves a language locally, before rendering the hero. It considers multiple independent signals with explicit precedence:

| Signal                        | Treatment                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `?lang=zh` or `?lang=en`      | Explicit request; highest precedence                                         |
| Saved manual choice           | `localStorage['vistep:language']`; precedes inferred signals                 |
| Ordered `navigator.languages` | Weighted by preference order; regional variants do not get duplicate votes   |
| `navigator.language`          | Fallback browser preference when not already represented                     |
| `Intl` format locale          | Supporting system-locale evidence                                            |
| Same-origin referring page    | Weak continuity signal from an existing Chinese or English page              |
| Time zone                     | Weak regional hint only; cannot overrule a clear browser language preference |
| No useful evidence / tie      | English                                                                      |

No IP lookup, geolocation permission, fingerprint or third-party language service is used. Missing storage or Intl support does not prevent loading. An inferred choice is not written as a permanent preference. The language switch saves an explicit choice and retains the same topic and fragment.

English home is `/en/`; Chinese home is `/zh/`. Existing Chinese `/explore/<slug>/` routes remain valid; English uses `/en/explore/<slug>/`. Explicit locale routes never redirect based on device settings. Root HTML offers a readable English fallback without JavaScript and links to both versions.

## Build-time search metadata

Every content page has a self-referencing canonical URL, reciprocal `zh-CN` and `en` links, an `x-default` link, language metadata, a unique title and description, Open Graph and Twitter metadata, and a 1200 × 630 PNG social card.

The shared schema emits a website and collection on homepages; explanations use `LearningResource`, `BreadcrumbList`, chapter links and an `AudioObject` with the matching transcript. Interactive canvas scenes are not falsely marked as videos. Structured data describes visible content and does not guarantee a Google rich result.

Articles and chapter transcripts are prerendered. Each transcript links back to a seekable `#t=seconds` position. Captions remain concise; the full spoken explanation is available without running an experiment.

Astro regenerates routes and the sitemap on every build. Topic additions automatically update metadata, language alternatives, schema and social cards. We do not publish an artificial daily `lastmod`, change frequency or priority. Search Console already knows the stable sitemap URL, so ordinary pushes need no repeated submission.

Production is indexable. Preview assets use `X-Robots-Tag: noindex, nofollow`; crawlers are allowed to fetch that header. Unknown URLs return an actual 404 with noindex. Preview and production have separate build directories and Workers.

## Verification

`pnpm audit:build` checks canonical URLs, sitemap coverage, alternate targets, descriptions, social PNG dimensions, structured data, transcript counts and internal assets. Language tests cover conflicting preferences, unsupported languages, duplicate regional variants and fallback behavior. Browser review covers persistence and first paint.

See [Search Console operations](search-console.md). Follow Google's guidance on [localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) and [structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).
