# Chemistry and biology production

The user requested all content in both reviewed inventories. The target manifests contain 183 chemistry and 172 biology textbook positions, including separately labelled mechanism/model demonstrations. Preserve every target ID and textbook order. These counts are positions, not a required number of films.

Use `.agents/skills/vistep-scene/SKILL.md`, `docs/creating-a-scene.md`, and `docs/retrospective.md`. Read the relevant source PDF/text, verify technical sources, and implement the actual phenomenon. Shared player/lifecycle and apparatus primitives are welcome; generic interchangeable scenes are not. A family may share a film only when each textbook position has a genuine, consecutive causal sequence and a correct exploration initial state.

## Ownership

- Chemistry owner: all targets in `chemistry-targets.json`; unique new scene slugs prefixed `chem-`; own chemistry models/renderers/styles/covers/articles/briefs/packets. Report a grouping map before authoring, then deliver bounded complete batches. Remaining independent chemistry groups can be reassigned explicitly.
- Biology foundations owner: required-1 and required-2 in `biology-targets.json` (88 positions); new slugs prefixed `bio-`; own `bio-foundations` plan and mappings, and the complete scene files named in it.
- Biology systems owner: elective-1, elective-2 and elective-3 (84 positions); new slugs prefixed `bio-`; own `bio-systems` plan and mappings, and the complete scene files named in it.
- Root owns shared registries, teaching UI/routes, curriculum builder, translations, narration generation/manifests, shared integration helpers, source catalogs, global checks and release.

Workers do not edit shared registries, global styles or narration manifests. Do not run a global format/build, start a global narration process, commit or deploy. Use only scoped model/component tests. Freeze each handed-off batch before root integrates it. Preserve existing physical-science content.

## Handoff

Use `src/data/scene-packets/<slug>.json` as required by `scripts/integrate-scene-packets.mjs`. No preassigned topic numbers. Include original model-derived covers, complete bilingual MDX, meaningful independent-model tests, a brief with source/assumption/benchmark/boundary evidence, and planned bilingual narration. Realistic durations follow causal content and remain at most five minutes. Every control must change actual model or evidence state. Watch mode must be independent of previous exploration settings.

Use the shared `useShowcase()` clock. For deterministic apparatus selection prefer explicit variant keys and cue IDs; root will separate `sceneVariant` from the curriculum position ID. New variants may initially use the exact target ID, which is namespaced with `chem-` or `bio-`. Do not use ambiguous substrings of old physics IDs. Packet `curriculumVariants` keys must be the exact target IDs and their `chapterIds` must be consecutive valid cues. Include `sceneVariant` when the initial apparatus needs an explicit reusable key; root extends integration to preserve it.

For every target supply an entry in `drafts/pep-sciences/<owner>-mapping.json`:

```json
{
  "entries": [
    {
      "targetId": "exact-target-id",
      "sceneSlug": "chem-or-bio-scene",
      "chapterIds": ["consecutive-cue-id"],
      "sceneVariant": "explicit-apparatus-key-or-target-id",
      "nameEn": "Accurate English title",
      "goal": { "zh": "What the experiment establishes", "en": "Same learning goal" },
      "kind": { "zh": "Actual activity type", "en": "Actual activity type" },
      "chapterEn": "Chapter title",
      "sectionEn": "Section title"
    }
  ]
}
```

Do not label historical research, surveys or pure mechanisms as student experiments. Keep known historical conclusions distinct from direct observation and limits. Use the locally supplied textbooks as curricular evidence and browse primary/official scientific sources for models. Never redistribute the textbook PDFs or extracted full texts.

## Acceptance

Each batch report lists owned files, exact target coverage, model evidence, all chapters' causal changes, actual checks performed, and remaining visual/listening/device gaps. Root independently inspects desktop and narrow layouts, seeking, exploration, resources and silent continuity. Do not claim a screenshot sweep is continuous viewing, ASR is listening, or an emulated viewport is a real phone. Keep the production queue active through repairs.
