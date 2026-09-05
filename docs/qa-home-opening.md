# Homepage opening review · 2026-09-05

[简体中文](zh-CN/qa-home-opening.md) · [Documentation](README.md)

This revision replaces the oversized wordmark, literal derivation line and separate replay icon. The full English phrase now opens in the homepage title's space. Its letters gather, the adjacent s glyphs merge, and the resulting domain moves into the navigation wordmark as the localized heading appears. The sequence takes approximately 7.4 seconds and starts on page entry without a session-storage gate. The collection remains available throughout.

## Observations

- Reviewed the full sequence and intermediate frames in Chrome and the in-app browser, using desktop views of 1492 and 1440 px and narrow views of 390 and 320 px. The mobile phrase keeps three readable lines; both localized final headings fit without horizontal overflow.
- Checked automatic entry, language switching, replay through the full-meaning text, keyboard Enter, Escape to skip, and entering the collection during playback. Leaving the opening ends its animation. The final header wordmark and title restore their opacity.
- Found and fixed an early cancellation caused by an initialization resize event. Only an actual width change now ends the sequence; mobile browser-height changes do not cancel it.
- Reviewed preview version `2817791b-44d0-4717-8422-f8efbef485f1`. No warnings or errors were reported during the reviewed browser interactions. All 210 live asset, route, sitemap, robots and 404 checks matched the preview build, including its noindex policy.
- `pnpm verify` passed: 45 tests, 88 source files checked, production build and artifact audit. `pnpm build:preview` passed separately.

Reduced-motion and JavaScript-disabled fallbacks were inspected in source, not exercised through browser preference emulation in this review. Font loading has a bounded wait and an error fallback; deliberate font-request failures were not injected. Narrow browser views are not physical-device performance measurements. The twelve topic films and their recordings are unchanged by this revision.

Follow-up preview `3ce0cd13-19de-46ca-8444-0f8ec3b04348` adds wall-clock timing and fallback-style corrections. Automatic entry and the final layout were checked again in the browser. A repeated full download audit timed out on an unchanged Chinese network narration file; that rerun was incomplete, not a second full pass. Actions independently audits the actual production artifact during publication.
