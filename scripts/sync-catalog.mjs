/** Keep the two source catalogs derived from reviewed metadata and measured films.
 * This writes reference tables only; it cannot register or publish a scene.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { format, resolveConfig } from 'prettier';

export function readLiteralExport(path, name) {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const declarations = source.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations]);
  const declaration = declarations.find(
    (entry) => ts.isIdentifier(entry.name) && entry.name.text === name,
  );
  if (!declaration?.initializer) throw new Error(`${path}: missing ${name}`);
  const value = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(value);
    if (ts.isObjectLiteralExpression(node)) {
      const entries = node.properties.map((property) => {
        if (
          !ts.isPropertyAssignment(property) ||
          !property.name ||
          ts.isComputedPropertyName(property.name)
        )
          throw new Error(`${path}: ${name} must contain literal properties`);
        return [property.name.text, value(property.initializer)];
      });
      if (new Set(entries.map(([key]) => key)).size !== entries.length)
        throw new Error(`${path}: duplicate property`);
      return Object.fromEntries(entries);
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    throw new Error(`${path}: unsupported nonliteral in ${name}`);
  };
  return value(declaration.initializer);
}

export function catalogTables({ topics, categories, discovery, films, translations }, locale) {
  const ids = new Set(categories.map((category) => category.id));
  for (const topic of topics) {
    if (!ids.has(discovery[topic.slug]?.category))
      throw new Error(`Missing or unknown discovery category: ${topic.slug}`);
  }
  const text = (value) => {
    const translated = locale === 'zh' ? value : translations[value];
    if (!translated) throw new Error(`Missing ${locale} catalog text: ${value}`);
    return translated.replaceAll('|', '&#124;').replaceAll('\n', ' ');
  };
  return categories
    .map((category) => {
      const rows = topics
        .filter((topic) => discovery[topic.slug]?.category === category.id)
        .map((topic) => {
          const duration = films[topic.slug]?.duration;
          if (!Number.isFinite(duration) || duration <= 0 || duration > 300)
            throw new Error(`Missing measured film: ${topic.slug}`);
          const seconds = Math.ceil(duration);
          const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
          const link =
            locale === 'zh'
              ? `../../src/content/${topic.slug}.mdx`
              : `../src/content/en/${topic.slug}.mdx`;
          return `| [${text(topic.name)}](${link}) | ${time} | ${text(topic.question)} |`;
        });
      return `## ${category.label[locale]}\n\n| ${locale === 'zh' ? '专题 | 演示 | 问题' : 'Exploration | Film | Question'} |\n| --- | --- | --- |\n${rows.join('\n')}\n`;
    })
    .join('\n');
}

export async function syncCatalog(root, write = false) {
  const read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  const data = {
    topics: readLiteralExport(resolve(root, 'src/data/topics.ts'), 'topics'),
    categories: readLiteralExport(
      resolve(root, 'src/data/discovery-metadata.ts'),
      'discoveryCategories',
    ),
    discovery: readLiteralExport(
      resolve(root, 'src/data/discovery-metadata.ts'),
      'discoveryMetadata',
    ),
    films: read('src/data/film-timeline.json'),
    translations: read('src/i18n/en.json'),
  };
  if (data.topics.some((topic) => !data.discovery[topic.slug]))
    throw new Error('A scene has no discovery metadata');
  const changed = [];
  for (const locale of ['en', 'zh']) {
    const path = resolve(root, locale === 'en' ? 'docs/catalog.md' : 'docs/zh-CN/catalog.md');
    const old = readFileSync(path, 'utf8');
    const split = old.search(/^## /m);
    if (split < 0) throw new Error(`${path}: no catalog section`);
    const next = await format(old.slice(0, split) + catalogTables(data, locale), {
      ...(await resolveConfig(path)),
      filepath: path,
    });
    if (next !== old) {
      changed.push(path);
      if (write) writeFileSync(path, next);
    }
  }
  return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--write')) throw new Error('Only --write is supported');
  const changed = await syncCatalog(
    resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    args.includes('--write'),
  );
  console.log(
    changed.length
      ? `${args.includes('--write') ? 'Updated' : 'Outdated'} ${changed.length} source catalogs.`
      : 'Source catalogs match metadata and measured films.',
  );
  if (changed.length && !args.includes('--write')) process.exitCode = 1;
}
