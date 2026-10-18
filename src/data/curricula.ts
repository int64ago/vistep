import { localPath, type Locale } from '../i18n';
import source from './curriculum-source.json';
import variants from './curriculum-variants.json';
import { topics } from './topics';

export type CurriculumText = Record<Locale, string>;

/** A lesson belongs to a textbook location; its scene can be reused by other curricula. */
export interface CurriculumLesson {
  id: string;
  order: number;
  sceneSlug: string;
  name: CurriculumText;
  textbookTitle: CurriculumText;
  page: number;
  kind: CurriculumText;
  goal: CurriculumText;
  experimentId?: string;
  chapterIds?: string[];
  titleIsOriginal?: boolean;
}

export interface CurriculumSection {
  id: string;
  order: number;
  title: CurriculumText;
  lessons: CurriculumLesson[];
}

export interface CurriculumChapter {
  id: string;
  order: number;
  title: CurriculumText;
  sections: CurriculumSection[];
}

export interface CurriculumBook {
  id: string;
  order: number;
  title: CurriculumText;
  chapters: CurriculumChapter[];
}

export interface Curriculum {
  id: string;
  title: CurriculumText;
  subject: CurriculumText;
  stage: CurriculumText;
  publisher: CurriculumText;
  description: CurriculumText;
  books: CurriculumBook[];
}

export interface CurriculumContext {
  curriculum: Curriculum;
  book: CurriculumBook;
  chapter: CurriculumChapter;
  section: CurriculumSection;
  lesson: CurriculumLesson;
}

/** The audited inventory is separate from reusable scene registrations. */
export const curriculumInventory = source;
const variantMap = variants as Record<string, { sceneSlug: string; chapterIds: string[] }>;
const registeredScenes = new Set(topics.map((topic) => topic.slug));

function buildTextbookBooks(): CurriculumBook[] {
  const books: CurriculumBook[] = [];
  for (const item of source) {
    const variant = variantMap[item.id];
    const sceneSlug = variant?.sceneSlug ?? item.existingSceneSlug;
    if (!sceneSlug || !registeredScenes.has(sceneSlug)) continue;
    let book = books.find((entry) => entry.id === item.book.id);
    if (!book) {
      book = { ...item.book, chapters: [] };
      books.push(book);
    }
    let chapter = book.chapters.find((entry) => entry.id === item.chapter.id);
    if (!chapter) {
      chapter = { ...item.chapter, sections: [] };
      book.chapters.push(chapter);
    }
    let section = chapter.sections.find((entry) => entry.id === item.section.id);
    if (!section) {
      section = { ...item.section, lessons: [] };
      chapter.sections.push(section);
    }
    section.lessons.push({
      id: item.id === 'required-1-newton-tube' ? 'newton-tube' : item.id,
      experimentId: item.id,
      order: item.order,
      sceneSlug,
      chapterIds: variant?.chapterIds,
      name: item.name,
      textbookTitle: item.textbookTitle,
      titleIsOriginal: item.titleIsOriginal,
      page: item.page,
      kind: item.kind,
      goal: item.goal,
    });
  }
  return books;
}

export const curricula: Curriculum[] = [
  {
    id: 'pep-high-school-physics',
    title: { zh: '人教版高中物理', en: 'PEP High School Physics' },
    subject: { zh: '物理', en: 'Physics' },
    stage: { zh: '高中', en: 'High school' },
    publisher: { zh: '人民教育出版社', en: 'People’s Education Press' },
    description: {
      zh: '沿着教材的学习顺序，把实验中的关键过程看清楚。',
      en: 'Follow the textbook’s learning sequence and see the key moments of each experiment.',
    },
    books: buildTextbookBooks(),
  },
];

const byOrder = <T extends { order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.order - b.order);

export function getCurriculum(id: string) {
  return curricula.find((curriculum) => curriculum.id === id);
}

/** Always use textbook order, independently of scene publication or registry order. */
export function getCurriculumLessons(curriculumOrId: Curriculum | string): CurriculumContext[] {
  const curriculum =
    typeof curriculumOrId === 'string' ? getCurriculum(curriculumOrId) : curriculumOrId;
  if (!curriculum) return [];
  return byOrder(curriculum.books).flatMap((book) =>
    byOrder(book.chapters).flatMap((chapter) =>
      byOrder(chapter.sections).flatMap((section) =>
        byOrder(section.lessons).map((lesson) => ({ curriculum, book, chapter, section, lesson })),
      ),
    ),
  );
}

export function getCurriculumContext(sceneSlug: string, curriculumId: string) {
  return getCurriculumLessons(curriculumId).find(
    (context) => context.lesson.sceneSlug === sceneSlug,
  );
}

export function curriculumPath(id: string, locale: Locale) {
  return localPath(`/teaching/${id}/`, locale);
}

export function curriculumSectionId(context: CurriculumContext) {
  return `${context.book.id}-${context.chapter.id}-${context.section.id}`;
}

export function curriculumLessonPath(context: CurriculumContext, locale: Locale) {
  return localPath(`/teaching/${context.curriculum.id}/${context.lesson.id}/`, locale);
}

export function curriculumSectionPath(context: CurriculumContext, locale: Locale) {
  return `${curriculumPath(context.curriculum.id, locale)}#${curriculumSectionId(context)}`;
}

export function curriculumSectionNumber(context: Pick<CurriculumContext, 'chapter' | 'section'>) {
  return context.chapter.order > 0 &&
    context.chapter.order < 99 &&
    context.section.order > 0 &&
    context.section.order < 99
    ? `${context.chapter.order}.${context.section.order}`
    : '';
}

export function curriculumNeighbors(context: CurriculumContext) {
  const lessons = getCurriculumLessons(context.curriculum);
  const index = lessons.findIndex((item) => item.lesson.id === context.lesson.id);
  return { previous: lessons[index - 1], next: lessons[index + 1] };
}
