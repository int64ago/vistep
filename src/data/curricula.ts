import { localPath, type Locale } from '../i18n';
import source from './curriculum-source.json';
import chemistrySource from './chemistry-curriculum-source.json';
import biologySource from './biology-curriculum-source.json';
import variants from './curriculum-variants.json';
import { topics } from './topics';
import type { FilmSelection } from '../lib/film';
import { teachingExplanations, type TeachingExplanation } from './teaching-explanations';

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
  explanation?: TeachingExplanation;
  experimentId?: string;
  chapterIds?: string[];
  /** Initial apparatus state, independent of the textbook location that links to it. */
  sceneVariant?: string;
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
  subjectKey: 'physics' | 'chemistry' | 'biology';
  title: CurriculumText;
  subject: CurriculumText;
  stage: CurriculumText;
  publisher: CurriculumText;
  description: CurriculumText;
  books: CurriculumBook[];
}

export interface CurriculumSourceEntry {
  id: string;
  book: Pick<CurriculumBook, 'id' | 'order' | 'title'>;
  chapter: Pick<CurriculumChapter, 'id' | 'order' | 'title'>;
  section: Pick<CurriculumSection, 'id' | 'order' | 'title'>;
  order: number;
  page: number;
  name: CurriculumText;
  textbookTitle: CurriculumText;
  titleIsOriginal: boolean;
  goal: CurriculumText;
  kind: CurriculumText;
  existingSceneSlug: string | null;
}

export interface CurriculumContext {
  curriculum: Curriculum;
  book: CurriculumBook;
  chapter: CurriculumChapter;
  section: CurriculumSection;
  lesson: CurriculumLesson;
}

/** The audited inventory is separate from reusable scene registrations. */
export const curriculumInventories: Record<string, CurriculumSourceEntry[]> = {
  'pep-high-school-physics': source,
  'pep-high-school-chemistry': chemistrySource,
  'pep-high-school-biology': biologySource,
};
export const curriculumInventory = Object.values(curriculumInventories).flat();
const variantMap = variants as Record<
  string,
  { sceneSlug: string; chapterIds: string[]; sceneVariant?: string }
>;
// Verified against the supplied book's printed page and Fig. 7.2-3.
// Keep the original inventory for provenance; correction never changes learning order.
const verifiedPageCorrections: Record<string, number> = { 'required-2-cavendish': 53 };
const registeredScenes = new Set(topics.map((topic) => topic.slug));

function buildTextbookBooks(entries: readonly CurriculumSourceEntry[]): CurriculumBook[] {
  const books: CurriculumBook[] = [];
  for (const item of entries) {
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
      sceneVariant: variant?.sceneVariant,
      name: item.name,
      textbookTitle: item.textbookTitle,
      titleIsOriginal: item.titleIsOriginal,
      page: verifiedPageCorrections[item.id] ?? item.page,
      kind: item.kind,
      goal: item.goal,
      explanation: teachingExplanations[item.id],
    });
  }
  return books;
}

const registeredCurricula: Curriculum[] = [
  {
    id: 'pep-high-school-physics',
    subjectKey: 'physics',
    title: { zh: '人教版高中物理', en: 'PEP High School Physics' },
    subject: { zh: '物理', en: 'Physics' },
    stage: { zh: '高中', en: 'High school' },
    publisher: { zh: '人民教育出版社', en: 'People’s Education Press' },
    description: {
      zh: '从看得见的运动与变化出发，追问力、能量和波动背后的规律。',
      en: 'Start with visible motion and change, then uncover the principles of forces, energy and waves.',
    },
    books: buildTextbookBooks(source),
  },
  {
    id: 'pep-high-school-chemistry',
    subjectKey: 'chemistry',
    title: { zh: '人教版高中化学', en: 'PEP High School Chemistry' },
    subject: { zh: '化学', en: 'Chemistry' },
    stage: { zh: '高中', en: 'High school' },
    publisher: { zh: '人民教育出版社', en: 'People’s Education Press' },
    description: {
      zh: '从一束光、一种颜色或一次反应，走进微粒与物质变化的世界。',
      en: 'Follow a beam, a colour or a reaction into the world of particles and chemical change.',
    },
    books: buildTextbookBooks(chemistrySource),
  },
  {
    id: 'pep-high-school-biology',
    subjectKey: 'biology',
    title: { zh: '人教版高中生物', en: 'PEP High School Biology' },
    subject: { zh: '生物', en: 'Biology' },
    stage: { zh: '高中', en: 'High school' },
    publisher: { zh: '人民教育出版社', en: 'People’s Education Press' },
    description: {
      zh: '追踪水、能量和信息怎样流动，理解细胞与生命系统为何这样运作。',
      en: 'Trace water, energy and information to understand how cells and living systems work.',
    },
    books: buildTextbookBooks(biologySource),
  },
];
/** Only curricula with registered lessons have a public entry point. */
export const curricula = registeredCurricula.filter((curriculum) => curriculum.books.length > 0);

export function curriculumFilmSelection(lesson?: CurriculumLesson): FilmSelection | undefined {
  if (!lesson || (!lesson.chapterIds?.length && !lesson.sceneVariant)) return undefined;
  return {
    chapterIds: lesson.chapterIds ?? [],
    variant: lesson.sceneVariant ?? lesson.experimentId ?? lesson.id,
  };
}

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
