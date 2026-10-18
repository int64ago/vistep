import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import {
  curricula,
  curriculumLessonPath,
  curriculumSectionId,
  getCurriculumLessons,
  getCurriculum,
  curriculumInventory,
  curriculumInventories,
  curriculumFilmSelection,
  type Curriculum,
  type CurriculumSection,
} from './curricula';
import { topics } from './topics';
import { rasterCoverSlugs } from './raster-covers';
import source from './curriculum-source.json';
import variants from './curriculum-variants.json';
import timeline from './film-timeline.json';
import { featuredTeachingLessons, teachingExplanations } from './teaching-explanations';

describe('textbook learning paths', () => {
  it('corrects the Cavendish column page without rewriting the source inventory or learning position', () => {
    const raw = source.find((entry) => entry.id === 'required-2-cavendish')!;
    const shown = getCurriculumLessons('pep-high-school-physics').find(
      ({ lesson }) => lesson.experimentId === raw.id,
    )!;
    expect(raw.page).toBe(52);
    expect(shown.lesson.page).toBe(53);
    expect(shown.lesson.order).toBe(raw.order);
    expect(shown.lesson.textbookTitle).toEqual(raw.textbookTitle);
    expect(shown.section.id).toBe(raw.section.id);
  });

  it('keeps each authored explanation attached to its own textbook scene', () => {
    const lessons = curricula.flatMap((curriculum) => getCurriculumLessons(curriculum));
    for (const [id, explanation] of Object.entries(teachingExplanations)) {
      const context = lessons.find(({ lesson }) => lesson.experimentId === id);
      expect(context, id).toBeDefined();
      expect(context!.lesson.sceneSlug, id).toBe(explanation.sceneSlug);
      expect(context!.lesson.explanation, id).toBe(explanation);
      for (const locale of ['zh', 'en'] as const) {
        for (const text of [
          explanation.question,
          explanation.lead,
          explanation.principle,
          explanation.transfer.question,
          explanation.transfer.explanation,
        ]) {
          expect(text[locale].trim(), `${id}/${locale}`).not.toBe('');
        }
      }
    }
    expect(new Set(featuredTeachingLessons).size).toBe(featuredTeachingLessons.length);
    for (const id of featuredTeachingLessons) expect(teachingExplanations[id], id).toBeDefined();
  });

  it('retains the osmotic cause before red-cell and plant-cell consequences', () => {
    const context = getCurriculumLessons('pep-high-school-biology').find(
      ({ lesson }) => lesson.experimentId === 'bio-required-1-064-1',
    )!;
    expect(curriculumFilmSelection(context.lesson)).toEqual({
      chapterIds: ['diffusion', 'funnel', 'red-cell', 'plasmolysis', 'recovery'],
      variant: 'plant',
    });
    expect(context.lesson.textbookTitle.zh).toBe('探究植物细胞的吸水和失水');
    const redCell = getCurriculumLessons('pep-high-school-biology').find(
      ({ lesson }) => lesson.experimentId === 'bio-required-1-063-1',
    )!;
    expect(curriculumFilmSelection(redCell.lesson)).toEqual({
      chapterIds: ['funnel', 'red-cell'],
      variant: 'red-cell',
    });
  });

  it('publishes the complete chemistry and biology inventories in textbook learning order', () => {
    for (const [id, counts] of [
      ['pep-high-school-chemistry', [36, 39, 29, 33, 46]],
      ['pep-high-school-biology', [55, 33, 30, 27, 27]],
    ] as const) {
      const curriculum = getCurriculum(id)!;
      const inventory = curriculumInventories[id];
      expect(inventory, id).toHaveLength(counts.reduce<number>((sum, count) => sum + count, 0));
      expect(
        curriculum.books.map(
          (book) => getCurriculumLessons({ ...curriculum, books: [book] }).length,
        ),
        id,
      ).toEqual(counts);
      const expected = [...inventory].sort(
        (a, b) =>
          a.book.order - b.book.order ||
          a.chapter.order - b.chapter.order ||
          a.section.order - b.section.order ||
          a.order - b.order,
      );
      expect(
        getCurriculumLessons(id).map(({ lesson }) => lesson.experimentId),
        id,
      ).toEqual(expected.map((entry) => entry.id));
    }
  });
  it('covers all six audited books without dropping a learning position', () => {
    expect(source).toHaveLength(271);
    const lessons = getCurriculumLessons('pep-high-school-physics');
    const expected = [...source].sort(
      (a, b) =>
        a.book.order - b.book.order ||
        a.chapter.order - b.chapter.order ||
        a.section.order - b.section.order ||
        a.order - b.order,
    );
    expect(lessons.map(({ lesson }) => lesson.experimentId)).toEqual(
      expected.map((entry) => entry.id),
    );
    expect(
      getCurriculum('pep-high-school-physics')!.books.map(
        (book) =>
          getCurriculumLessons({ ...getCurriculum('pep-high-school-physics')!, books: [book] })
            .length,
      ),
    ).toEqual([37, 31, 41, 59, 38, 65]);
  });
  it('keeps each textbook selection attached to a real, consecutive film segment', () => {
    const sourceIds = new Set(curriculumInventory.map((entry) => entry.id));
    expect(sourceIds.size).toBe(curriculumInventory.length);
    for (const [id, selection] of Object.entries(variants)) {
      expect(sourceIds.has(id), id).toBe(true);
      const film = timeline[selection.sceneSlug as keyof typeof timeline];
      expect(film, selection.sceneSlug).toBeDefined();
      const indices = selection.chapterIds.map((chapterId) =>
        film.chapters.findIndex((chapter) => chapter.id === chapterId),
      );
      expect(indices.length, id).toBeGreaterThan(0);
      expect(
        indices.every((index, i) => index >= 0 && (i === 0 || index === indices[i - 1] + 1)),
        id,
      ).toBe(true);
    }
  });
  it('sorts by the full textbook hierarchy even when stored out of order', () => {
    const base = getCurriculum('pep-high-school-physics')!;
    const book = base.books[0];
    const chapter = book.chapters[0];
    const section = chapter.sections[0];
    const lesson = section.lessons[0];
    const makeSection = (id: string, order: number, lessonOrders: number[]): CurriculumSection => ({
      ...section,
      id,
      order,
      lessons: lessonOrders.map((lessonOrder) => ({
        ...lesson,
        id: `${id}-l${lessonOrder}`,
        order: lessonOrder,
      })),
    });
    const shuffled: Curriculum = {
      ...base,
      books: [
        {
          ...book,
          id: 'b2',
          order: 2,
          chapters: [{ ...chapter, order: 1, sections: [makeSection('b2-c1-s1', 1, [1])] }],
        },
        {
          ...book,
          id: 'b1',
          order: 1,
          chapters: [
            {
              ...chapter,
              order: 2,
              sections: [makeSection('b1-c2-s2', 2, [2, 1]), makeSection('b1-c2-s1', 1, [1])],
            },
            { ...chapter, order: 1, sections: [makeSection('b1-c1-s1', 1, [1])] },
          ],
        },
      ],
    };
    const original = JSON.stringify(shuffled);
    expect(getCurriculumLessons(shuffled).map(({ lesson }) => lesson.id)).toEqual([
      'b1-c1-s1-l1',
      'b1-c2-s1-l1',
      'b1-c2-s2-l1',
      'b1-c2-s2-l2',
      'b2-c1-s1-l1',
    ]);
    expect(JSON.stringify(shuffled)).toBe(original);
  });

  it('keeps the initial apparatus stable when another textbook reuses its film', () => {
    const base = getCurriculumLessons('pep-high-school-physics')[0].lesson;
    const first = {
      ...base,
      id: 'first-location',
      experimentId: 'chem-first-location',
      chapterIds: ['observe', 'compare'],
      sceneVariant: 'shared-apparatus',
    };
    const second = { ...first, id: 'second-location', experimentId: 'bio-second-location' };
    expect(curriculumFilmSelection(first)).toEqual(curriculumFilmSelection(second));
    expect(curriculumFilmSelection(first)).toEqual({
      chapterIds: ['observe', 'compare'],
      variant: 'shared-apparatus',
    });
    expect(curriculumFilmSelection({ ...first, sceneVariant: undefined })?.variant).toBe(
      'chem-first-location',
    );
    expect(curriculumFilmSelection({ ...first, chapterIds: undefined })).toEqual({
      chapterIds: [],
      variant: 'shared-apparatus',
    });
    expect(
      curriculumFilmSelection({ ...first, chapterIds: undefined, sceneVariant: undefined }),
    ).toBeUndefined();
  });

  it('links only complete registered scenes and keeps lesson routes unique', () => {
    const sceneSlugs = new Set(topics.map((topic) => topic.slug));
    const lessonRoutes = new Set<string>();
    for (const curriculum of curricula) {
      for (const context of getCurriculumLessons(curriculum)) {
        expect(sceneSlugs.has(context.lesson.sceneSlug)).toBe(true);
        expect(rasterCoverSlugs).toContain(context.lesson.sceneSlug);
        expect(context.lesson.page).toBeGreaterThan(0);
        expect(Number.isInteger(context.lesson.page)).toBe(true);
        expect(curriculumSectionId(context)).toBeTruthy();
        for (const locale of ['zh', 'en'] as const) {
          expect(context.lesson.name[locale].trim()).not.toBe('');
          expect(context.lesson.textbookTitle[locale].trim()).not.toBe('');
          expect(context.lesson.goal[locale].trim()).not.toBe('');
          expect(
            existsSync(
              `src/content/${locale === 'en' ? 'en/' : ''}${context.lesson.sceneSlug}.mdx`,
            ),
          ).toBe(true);
          const route = curriculumLessonPath(context, locale);
          expect(lessonRoutes.has(route)).toBe(false);
          lessonRoutes.add(route);
          expect(route).toBe(
            `${locale === 'en' ? '/en' : ''}/teaching/${curriculum.id}/${context.lesson.id}/`,
          );
        }
      }
    }
  });
});
