/** Small, deterministic catalog queries. This module contains no experiment engines. */
export type DiscoveryFilters = {
  query: string;
  category: string;
  age: number | null;
  length: 'any' | 'short' | 'long';
};
export type SearchableScene = {
  slug: string;
  category: string;
  minAge: number;
  duration: number;
  name: string;
  keywords: string;
  text: string;
};
export const emptyFilters = (): DiscoveryFilters => ({
  query: '',
  category: 'all',
  age: null,
  length: 'any',
});
export function normalizeSearch(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function readFilters(search: string, categories: readonly string[]): DiscoveryFilters {
  const params = new URLSearchParams(search);
  const category = params.get('category') ?? 'all';
  const age = Number(params.get('age'));
  const length = params.get('length');
  return {
    query: (params.get('q') ?? '').trim().slice(0, 160),
    category: categories.includes(category) ? category : 'all',
    age: [8, 10, 12, 14].includes(age) ? age : null,
    length: length === 'short' || length === 'long' ? length : 'any',
  };
}
export function writeFilters(url: URL, filters: DiscoveryFilters): URL {
  const next = new URL(url);
  const fields = {
    q: filters.query.trim(),
    category: filters.category === 'all' ? '' : filters.category,
    age: filters.age === null ? '' : String(filters.age),
    length: filters.length === 'any' ? '' : filters.length,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value) next.searchParams.set(key, value);
    else next.searchParams.delete(key);
  }
  return next;
}
export function sceneScore(scene: SearchableScene, filters: DiscoveryFilters): number {
  if (filters.category !== 'all' && scene.category !== filters.category) return -1;
  if (filters.age !== null && scene.minAge > filters.age) return -1;
  if (filters.length === 'short' && scene.duration > 180) return -1;
  if (filters.length === 'long' && scene.duration <= 180) return -1;
  const tokens = normalizeSearch(filters.query).split(' ').filter(Boolean);
  const name = normalizeSearch(scene.name);
  const keywords = normalizeSearch(scene.keywords + ' ' + scene.slug);
  const text = normalizeSearch(scene.text.replace(/https?:\/\/[^\s\u3400-\u9fff]+/gi, ' '));
  const contains = (field: string, token: string) => {
    if (!/^[a-z0-9]+$/.test(token)) return field.includes(token);
    // Acronyms such as AI must not match rAInbow or chAIn. Longer words can
    // complete from their beginning (gear → gears), never from the middle.
    return (field.match(/[a-z0-9]+/g) ?? []).some((word) =>
      token.length <= 2 ? word === token : word.startsWith(token),
    );
  };
  let score = 0;
  for (const token of tokens) {
    if (contains(name, token)) score += 8;
    else if (contains(keywords, token)) score += 4;
    else if (contains(text, token)) score += 1;
    else return -1;
  }
  return score;
}
export function matchingScenes<T extends SearchableScene>(
  scenes: readonly T[],
  filters: DiscoveryFilters,
): T[] {
  return scenes
    .map((scene, index) => ({ scene, index, score: sceneScore(scene, filters) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ scene }) => scene);
}
