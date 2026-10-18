import physics from './teaching-explanations/physics.json';
import chemistry from './teaching-explanations/chemistry.json';
import biology from './teaching-explanations/biology.json';

/** Authored questions belong to a textbook location, not just to a reusable apparatus. */
type Text = { zh: string; en: string };

export interface TeachingExplanation {
  sceneSlug: string;
  question: Text;
  lead: Text;
  principle: Text;
  transfer: { question: Text; explanation: Text };
}

export const teachingExplanations: Record<string, TeachingExplanation> = {
  ...physics,
  ...chemistry,
  ...biology,
};

export const featuredTeachingLessons = [
  'required-1-newton-second-law',
  'chem-required-1-experiment-1-1',
  'bio-required-1-064-1',
];
