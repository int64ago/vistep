import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
import english from '../en.json';
import timeline from '../../data/film-timeline.json';

const root = process.cwd();
const dictionary = english as Record<string, string>;
const registry = readFileSync(resolve(root, 'src/data/experiments.ts'), 'utf8');
const loaders = new Map(
  [...registry.matchAll(/(?:'([^']+)'|(\w+)):\s*\(\)\s*=>\s*import\('([^']+)'\)/g)].map((m) => [
    m[1] || m[2],
    resolve(root, 'src/data', m[3]),
  ]),
);

/** Build-time only: collect copy from the island's own dependency graph, including fallbacks.
 * Type imports and the lazy scene registry must not pull unrelated scenes into a dictionary. */
export function islandDictionary(kind: 'home' | 'experiment', slug?: string) {
  const seen = new Set<string>(),
    literals = new Set<string>(),
    templates: RegExp[] = [];
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function visit(base: string) {
    const file = ['', '.tsx', '.ts', '/index.ts', '.json']
      .map((ext) => base + ext)
      .find((p) => existsSync(p) && /\.(?:tsx?|json)$/.test(p));
    if (!file || seen.has(file) || file.endsWith('/data/experiments.ts')) return;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    // JSON reached by a scene is model data. The global translation source stays server-only.
    if (file.endsWith('/en.json')) return;
    if (file.endsWith('.json')) {
      const collect = (value: unknown) => {
        if (typeof value === 'string') literals.add(value);
        else if (value && typeof value === 'object') Object.values(value).forEach(collect);
      };
      collect(JSON.parse(source));
      return;
    }
    const ast = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const dependency = (specifier: string) => {
      if (specifier.startsWith('.')) visit(resolve(dirname(file), specifier));
    };
    function walk(node: ts.Node) {
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause;
        const named = clause?.namedBindings;
        const onlyTypes =
          clause?.isTypeOnly ||
          (!clause?.name &&
            named &&
            ts.isNamedImports(named) &&
            named.elements.every((item) => item.isTypeOnly));
        if (!onlyTypes && ts.isStringLiteral(node.moduleSpecifier))
          dependency(node.moduleSpecifier.text);
      } else if (
        ts.isExportDeclaration(node) &&
        !node.isTypeOnly &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        dependency(node.moduleSpecifier.text);
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        dependency(node.arguments[0].text);
      } else if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'URL' &&
        node.arguments?.[0] &&
        ts.isStringLiteral(node.arguments[0]) &&
        /\.tsx?$/.test(node.arguments[0].text) &&
        node.arguments[1]?.getText(ast) === 'import.meta.url'
      ) {
        // Workers can return model-generated copy through messages rather than imports.
        dependency(node.arguments[0].text);
      }
      if (ts.isStringLiteralLike(node)) literals.add(node.text);
      if (ts.isTemplateExpression(node)) {
        const parts = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
        if (parts.some((part) => /[\u3400-\u9fff]/.test(part)))
          templates.push(new RegExp(`^${parts.map(escape).join('.*')}$`, 's'));
      }
      ts.forEachChild(node, walk);
    }
    walk(ast);
  }
  if (kind === 'home') visit(resolve(root, 'src/components/HomeObject'));
  else {
    const scene = slug && loaders.get(slug);
    if (!scene) throw new Error(`No experiment dictionary entry for ${slug}`);
    visit(resolve(root, 'src/components/Experiment'));
    visit(scene);
    const film = timeline[slug as keyof typeof timeline];
    for (const chapter of film.chapters) {
      literals.add(chapter.title);
      literals.add(chapter.caption);
    }
  }
  const text = [...literals].join('\n');
  return Object.fromEntries(
    Object.entries(dictionary).filter(
      ([key]) => text.includes(key) || templates.some((pattern) => pattern.test(key)),
    ),
  );
}
