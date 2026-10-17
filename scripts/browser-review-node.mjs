import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';

export function reviewOptions(argv) {
  const options = {
    all: false,
    allChapters: false,
    faults: true,
    faultsOnly: false,
    prepareOnly: false,
    directory: 'dist-preview',
    outDir: 'artifacts/browser-review/latest',
    browser: 'chromium',
    origin: null,
    slugs: undefined,
    locales: ['zh', 'en'],
    viewports: undefined,
    help: false,
  };
  const value = (flag, i) => {
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`${flag} needs a value`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--all') options.all = true;
    else if (flag === '--all-chapters') options.allChapters = true;
    else if (flag === '--no-faults') options.faults = false;
    else if (flag === '--faults-only') options.faultsOnly = true;
    else if (flag === '--prepare-only') options.prepareOnly = true;
    else if (flag === '--help') options.help = true;
    else if (
      [
        '--directory',
        '--out-dir',
        '--browser',
        '--base-url',
        '--slugs',
        '--locale',
        '--widths',
      ].includes(flag)
    ) {
      const next = value(flag, i++);
      if (flag === '--directory') options.directory = next;
      if (flag === '--out-dir') options.outDir = next;
      if (flag === '--browser') options.browser = next;
      if (flag === '--base-url') options.origin = new URL(next).origin;
      if (flag === '--slugs') options.slugs = next.split(',').filter(Boolean);
      if (flag === '--locale') options.locales = next.split(',');
      if (flag === '--widths')
        options.viewports = next
          .split(',')
          .map((n) => ({ width: Number(n), height: Number(n) >= 1000 ? 1000 : 844 }));
    } else throw new Error(`Unknown browser review option: ${flag}`);
  }
  if (!['chromium', 'firefox', 'webkit'].includes(options.browser))
    throw new Error('Browser must be chromium, firefox or webkit');
  if (options.locales.some((locale) => !['zh', 'en'].includes(locale)))
    throw new Error('Locales must be zh and/or en');
  if (options.viewports?.some((v) => !Number.isInteger(v.width) || v.width < 240 || v.width > 4000))
    throw new Error('Viewport widths must be integers between 240 and 4000');
  if (options.faultsOnly && !options.faults)
    throw new Error('--faults-only cannot be combined with --no-faults');
  return options;
}

/** Include tracked and non-ignored untracked source contents, including the dirty worktree.
 * Generated build/review output and voice caches are excluded by Git ignore rules.
 */
export function sourceFingerprint(root = process.cwd()) {
  const git = (args) => execFileSync('git', args, { cwd: root, maxBuffer: 100 * 1024 * 1024 });
  const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
  const files = [
    ...new Set(
      git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
        .toString()
        .split('\0')
        .filter(Boolean),
    ),
  ].sort();
  const tree = createHash('sha256');
  for (const name of files) {
    if (/^(?:artifacts|dist|dist-preview|node_modules|\.voice-cache|\.venv-voice)\//.test(name))
      continue;
    const path = resolve(root, name);
    tree.update(name + '\0');
    tree.update(existsSync(path) && statSync(path).isFile() ? sha(readFileSync(path)) : 'deleted');
    tree.update('\n');
  }
  return {
    commit: git(['rev-parse', 'HEAD']).toString().trim(),
    treeHash: tree.digest('hex'),
    gitDiffHash: sha(git(['diff', '--binary', 'HEAD'])),
    fileCount: files.length,
    domain: 'tracked + non-ignored untracked source/assets; generated outputs excluded',
  };
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
export function parseByteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] ? (match[2] ? Math.min(size - 1, Number(match[2])) : size - 1) : size - 1;
  return Number.isSafeInteger(start) &&
    Number.isSafeInteger(end) &&
    start >= 0 &&
    start < size &&
    end >= start
    ? { start, end }
    : null;
}
export async function startStaticPreview(directory) {
  const root = resolve(directory);
  if (!existsSync(resolve(root, 'index.html')))
    throw new Error(`Build the preview first: missing ${directory}/index.html`);
  const server = createServer((request, response) => {
    let path;
    try {
      path = resolve(
        root,
        '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname),
      );
    } catch {
      response.writeHead(400).end();
      return;
    }
    if (relative(root, path).startsWith('..' + sep) || relative(root, path) === '..') {
      response.writeHead(403).end();
      return;
    }
    if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, 'index.html');
    const found = existsSync(path) && statSync(path).isFile();
    if (!found) path = resolve(root, '404.html');
    if (!existsSync(path)) {
      response.writeHead(404).end();
      return;
    }
    const size = statSync(path).size;
    const headers = {
      'Content-Type': mime[extname(path)] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    };
    const range = request.headers.range ? parseByteRange(request.headers.range, size) : null;
    if (request.headers.range && !range) {
      response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    const start = range?.start ?? 0,
      end = range?.end ?? size - 1;
    if (range) headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    headers['Content-Length'] = Math.max(0, end - start + 1);
    response.writeHead(found ? (range ? 206 : 200) : 404, headers);
    if (request.method === 'HEAD' || !size) response.end();
    else
      createReadStream(path, { start, end })
        .on('error', () => response.destroy())
        .pipe(response);
  });
  await new Promise((resolveReady, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveReady);
  });
  const address = server.address();
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolveClose) => {
        server.closeAllConnections();
        server.close(resolveClose);
      }),
  };
}
