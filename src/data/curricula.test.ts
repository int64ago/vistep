import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import {
  curricula,
  curriculumLessonPath,
  curriculumSectionId,
  getCurriculumLessons,
  type Curriculum,
  type CurriculumSection,
} from './curricula';
import { topics } from './topics';
import { rasterCoverSlugs } from './raster-covers';
import source from './curriculum-source.json';
import variants from './curriculum-variants.json';
import timeline from './film-timeline.json';

describe('textbook learning paths', () => {
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
      curricula[0].books.map(
        (book) => getCurriculumLessons({ ...curricula[0], books: [book] }).length,
      ),
    ).toEqual([37, 31, 41, 59, 38, 65]);
  });
  it('keeps each textbook selection attached to a real, consecutive film segment', () => {
    const sourceIds = new Set(source.map((entry) => entry.id));
    expect(sourceIds.size).toBe(source.length);
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
    const base = curricula[0];
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
