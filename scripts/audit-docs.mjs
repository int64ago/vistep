import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const directories = ['docs', '.agents', '.github', 'drafts'];
const scan = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? scan(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const markdown = [
  ...readdirSync(root).filter((file) => file.endsWith('.md')),
  ...directories.flatMap(scan),
].filter((file) => file.endsWith('.md'));
let count = 0;
for (const file of markdown) {
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    assert(
      existsSync(resolve(dirname(file), decodeURI(target))),
      `Broken local link in ${file}: ${target}`,
    );
    count++;
  }
}
console.log(
  `Documentation audit passed: ${markdown.length} Markdown files, ${count} local file links. External URLs and heading anchors require separate review.`,
);
