# Initial bilingual playback

[简体中文](zh-CN/qa-bilingual-narration.md) · [Review index](README.md#review-records)

Historical record: 2026-09-05. Worker version `6b038697-c5c2-4bf3-b294-e37b89ad012f`. This record applies only to that revision.

This historical review established transport and timing, **not Chinese intelligibility**. Later review found that the original Chinese synthesis was unintelligible despite valid decoding and playback. Those recordings have been replaced; see [production lessons](retrospective.md).

The build contained 26 localized content pages plus a bilingual 404, 24 MP3 tracks and 108 spoken segments. Thirty-one tests passed, type checking was clean and FFmpeg decoded every file. Recorded tempo was 0.92–0.98836.

Chrome inspected English and Chinese routes at desktop, 390 px and 320 px widths. English scene labels, controls and errors were translated; the small Transformer's Chinese vocabulary retained English semantic labels. Subtitle space accommodated the longest caption. Audio source URLs matched locale and topic, one media element per page, and readyState reached 4.

Printer playback exercised enabling sound, pause, replay, language switching, exploration and offscreen pause. The then-current Transformer reached 165 updates and held that count during generation. A local 503 audio fault produced a retry message and silent fallback; restoring the asset allowed playback. Disposal was inspected. These checks did not include real iOS/Android hardware or a human listening panel.

Live verification covered 26 pages, 24 recordings and 28 JS/CSS assets against local hashes. The old static service returned complete audio for Range requests; those short tracks were about 0.5 MB. English and Chinese printer tracks reached their former 34-second endpoint. None of these old timings or file sizes describes the new long-form films.
