import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
import english from '../en.json';
import timeline from '../../data/film-timeline.json';

const root = process.cwd();
const dictionary = english as Record<string, string>;
let loaderVersion = '';
let loaders = new Map<string, string>();

/** Read syntax rather than a formatting-dependent regular expression. */
export function readExperimentLoaders(source: string): Map<string, string> {
  const ast = ts.createSourceFile('experiments.ts', source, ts.ScriptTarget.Latest, true);
  const result = new Map<string, string>();
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== 'experimentLoaders' ||
        !declaration.initializer ||
        !ts.isObjectLiteralExpression(declaration.initializer)
      )
        continue;
      for (const property of declaration.initializer.properties) {
        if (
          !ts.isPropertyAssignment(property) ||
          !(ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name)) ||
          !ts.isArrowFunction(property.initializer)
        )
          continue;
        const body = property.initializer.body;
        if (
          !ts.isCallExpression(body) ||
          body.expression.kind !== ts.SyntaxKind.ImportKeyword ||
          !body.arguments[0] ||
          !ts.isStringLiteralLike(body.arguments[0])
        )
          continue;
        result.set(property.name.text, body.arguments[0].text);
      }
    }
  }
  return result;
}

function currentLoaders() {
  const path = resolve(root, 'src/data/experiments.ts');
  const { mtimeNs, size } = statSync(path, { bigint: true });
  const version = `${mtimeNs}:${size}`;
  if (version !== loaderVersion) {
    loaders = new Map(
      [...readExperimentLoaders(readFileSync(path, 'utf8'))].map(([slug, file]) => [
        slug,
        resolve(dirname(path), file),
      ]),
    );
    loaderVersion = version;
  }
  return loaders;
}

type SourceItem =
  | { kind: 'literal'; value: string }
  | { kind: 'dependency'; value: string }
  | { kind: 'template'; value: RegExp };
const sourceCache = new Map<string, { version: string; items: readonly SourceItem[] }>();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Cache extracted values, not ASTs. File versions keep development edits visible. */
export function readIslandSource(file: string): readonly SourceItem[] {
  const { mtimeNs, size } = statSync(file, { bigint: true });
  const version = `${mtimeNs}:${size}`;
  const cached = sourceCache.get(file);
  if (cached?.version === version) return cached.items;
  const source = readFileSync(file, 'utf8');
  const items: SourceItem[] = [];
  if (file.endsWith('.json')) {
    const collect = (value: unknown) => {
      if (typeof value === 'string') items.push({ kind: 'literal', value });
      else if (value && typeof value === 'object') Object.values(value).forEach(collect);
    };
    collect(JSON.parse(source));
  } else {
    const ast = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const dependency = (specifier: string) => {
      if (specifier.startsWith('.')) items.push({ kind: 'dependency', value: specifier });
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
      if (ts.isStringLiteralLike(node)) items.push({ kind: 'literal', value: node.text });
      if (ts.isTemplateExpression(node)) {
        const parts = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
        if (parts.some((part) => /[\u3400-\u9fff]/.test(part)))
          items.push({
            kind: 'template',
            value: new RegExp(`^${parts.map(escape).join('.*')}$`, 's'),
          });
      }
      ts.forEachChild(node, walk);
    }
    walk(ast);
  }
  sourceCache.set(file, { version, items });
  return items;
}

/** Build-time only: collect copy from the island's own dependency graph, including fallbacks.
 * Type imports and the lazy scene registry must not pull unrelated scenes into a dictionary. */
export function islandDictionary(kind: 'home' | 'experiment', slug?: string) {
  const seen = new Set<string>(),
    literals = new Set<string>(),
    templates: RegExp[] = [];
  function visit(base: string) {
    const file = ['', '.tsx', '.ts', '/index.ts', '.json']
      .map((ext) => base + ext)
      .find((p) => existsSync(p) && /\.(?:tsx?|json)$/.test(p));
    if (!file || seen.has(file) || file.endsWith('/data/experiments.ts')) return;
    seen.add(file);
    // JSON reached by a scene is model data. The global translation source stays server-only.
    if (file.endsWith('/en.json')) return;
    // Replay extraction order so dependency traversal and dictionary matching stay unchanged.
    for (const item of readIslandSource(file)) {
      if (item.kind === 'dependency') visit(resolve(dirname(file), item.value));
      else if (item.kind === 'literal') literals.add(item.value);
      else templates.push(item.value);
    }
  }
  if (kind === 'home') visit(resolve(root, 'src/components/HomeObject'));
  else {
    const scene = slug && currentLoaders().get(slug);
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
