# Memory and cache

[简体中文](../zh-CN/examples/memory-cache-brief.md)

## Causal argument

Track an addressed byte through a read-only cache. The turning point is a conflict miss while other sets are empty. A second run changes associativity at the same data capacity, with the same address trace and cold start.

## Direction and chapters

An address atlas and line cabinets retain block identities, tags, valid bits and returned values. Eight chapters show line fill, address decoding, spatial locality, temporal locality, conflict, associativity, LRU replacement and line-size comparison. Phones retain a window of relevant memory addresses instead of shrinking all 64 bytes.

## Model and limits

The independent model uses immutable 64-byte memory, exact set/tag/offset arithmetic and deterministic LRU. Data capacity excludes metadata. Misses load a whole aligned line; eviction removes a cache copy only. The separate queue-based reference checks 240 varied traces. Animation phases expose atomic reads; they are not CPU cycles or latency measurements. Writes, coherence, prefetch and multiple cache levels are excluded.

## Integration and evidence

Sources: `src/models/memory-cache.ts`, `src/components/experiments/MemoryCache.tsx`, `src/content/memory-cache.mdx`, `src/content/en/memory-cache.mdx`. Bilingual metadata, captions and speech are registered centrally; temporary packets are integration inputs, not a second source of truth. Technical references are linked in the topic registry and both articles. Artwork is original procedural SVG/HTML.

On 2026-09-05 the parent ran all six new model suites: 64 tests passed, including 10 for this topic. These tests establish numerical and state properties, not visual acceptance. Recorded narration is being generated on a shared measured chapter timeline; final timings and transcription evidence will be recorded after synthesis. No native listening, complete playback or physical-phone performance is claimed here.

The worker stopped at an account usage limit. The parent reviewed the persisted model, completed missing integration material and owns further UI, voice, failure-mode and release review.

## Measured integration

Both language tracks measure 191.5 seconds, sharing eight chapter windows. Assets: `/narration/memory-cache-zh-f3efb0bcc4ad.mp3` and `/narration/memory-cache-en-d16fc2bce8e5.mp3`. The parent confirmed all existing 26 narration, manifest, track and timeline entries remain semantically unchanged. The temporary packet has been consumed; canonical scripts now live in `src/data/narration.json`. Independent transcription and final browser review are in progress. Native listening and physical-phone measurements remain outstanding.

Final independent transcription: all 16 chapter/language pairs passed; minimum similarity 0.8677, minimum ending coverage 0.8750. This is not a listening judgment about natural delivery.
