# Mechanical detail and automatic demonstrations

[简体中文](zh-CN/qa-automatic-demos.md) · [Review index](README.md#review-records)

Historical record: 2026-09-05. Worker version `e856b90b-558a-461a-8541-9312d068da06`. This record applies only to that revision.

Automated checks covered involute profiles and meshing phase, closed tangent/arc belt paths, paired mesh edges and outward normals, and 48 sprocket configurations at eight phases. Printer rollers shared surface speed and pixel continuity. The traffic model produced a backward-moving slowdown without decorative motion. Type checking reported no errors; 27 tests passed and 14 pages built.

Chrome review used 1492 × 705, 390 × 844 and 320 × 740 viewports. The twelve scenes were inspected at their then-current short-film stages, including chain closure, four refrigerant paths, print transfer, wave cancellation, range constraints, network caching, JPEG reconstruction, model training/generation, dimension unfolding, pendulum energy, equal-input elevator scheduling and traffic history. Primary playback controls were at least 44 px; no horizontal overflow was recorded at 320 px.

Pause, replay, manual exploration, returning to the film and 2D/3D switching were exercised. Offscreen progression stopped. Source review covered disposal and Worker cleanup. Actual GPU-failure injection, OS reduced-motion changes and real-phone performance were not tested.

After deployment, 44 responses matched the build hashes. Unknown paths returned 404 and missing trailing slashes redirected. Production and DNS were unchanged at this historical preview stage.
