import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import english from './en.json';
import { localPath, localizedTopic, localeFromPath, translate } from './index';
import { topics } from '../data/topics';
import { films } from '../data/films';
const dictionary = english as Record<string, string>;
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );
describe('bilingual publishing', () => {
  it('switches the same topic and fragment without duplicating locale prefixes', () => {
    for (const path of ['/', '/explore/printer/', '/explore/transformer/#deeper']) {
      expect(localPath(localPath(path, 'en'), 'zh')).toBe(path === '/' ? '/zh/' : path);
      expect(localPath(localPath(path, 'en'), 'en')).toBe(localPath(path, 'en'));
    }
    expect(localeFromPath('/english/')).toBe('zh');
    expect(localeFromPath('/en/explore/jpeg/')).toBe('en');
    expect(translate('维度 {0}', 'en', 4)).toBe('Dimension 4');
  });
  it('publishes matching articles, metadata and film captions for every topic', () => {
    for (const topic of topics) {
      const translated = localizedTopic(topic, 'en');
      for (const key of ['title', 'question', 'description', 'category', 'name'] as const)
        expect(translated[key]).not.toMatch(/[\u3400-\u9fff]/);
      const text = readFileSync(`src/content/en/${topic.slug}.mdx`, 'utf8');
      for (const id of ['understand', 'try', 'deeper']) expect(text).toContain(`id="${id}"`);
      for (const chapter of films[topic.slug].chapters)
        expect(dictionary[chapter.caption]).toBeTruthy();
    }
  });
  it('only translates at module load inside lazily loaded experiments', () => {
    // English islands register the dictionary before rendering, but shared chunks may evaluate
    // first; a module-level t() there would freeze the Chinese source string.
    const early: string[] = [];
    for (const path of files('src/components')) {
      if (!/\.tsx?$/.test(path) || path.includes('.test.') || path.includes('/experiments/'))
        continue;
      const source = ts.createSourceFile(
        path,
        readFileSync(path, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const visit = (node: ts.Node, inFunction: boolean) => {
        const scoped = inFunction || ts.isFunctionLike(node) || ts.isClassLike(node);
        if (
          !scoped &&
          ts.isCallExpression(node) &&
          ['t', 'translate', 'tokenLabel'].includes(node.expression.getText(source))
        )
          early.push(`${path}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
        ts.forEachChild(node, (child) => visit(child, scoped));
      };
      visit(source, false);
    }
    expect(early).toEqual([]);
  });
  it('has English copy for every static localized React and Astro string', () => {
    const missing: string[] = [];
    for (const path of [...files('src/components'), ...files('src/layouts')]) {
      if (path.endsWith('.tsx')) {
        const source = ts.createSourceFile(
          path,
          readFileSync(path, 'utf8'),
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        );
        const visit = (node: ts.Node) => {
          if (
            ts.isCallExpression(node) &&
            ['t', 'tr'].includes(node.expression.getText(source)) &&
            node.arguments[0] &&
            ts.isStringLiteral(node.arguments[0])
          ) {
            const key = node.arguments[0].text;
            if (!dictionary[key]) missing.push(`${path}: ${key}`);
          }
          ts.forEachChild(node, visit);
        };
        visit(source);
      } else if (path.endsWith('.astro')) {
        for (const match of readFileSync(path, 'utf8').matchAll(/tr\('([^']*)'\)/g))
          if (!dictionary[match[1]]) missing.push(`${path}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
