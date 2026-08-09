import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourceRoot = join(root, 'src');
const tokenRoot = join(sourceRoot, 'styles', 'tokens');
const supportedExtensions = new Set(['.css', '.ts', '.tsx']);

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const file = join(directory, name);
    return statSync(file).isDirectory() ? walk(file) : [file];
  });
}

const files = walk(sourceRoot).filter((file) => supportedExtensions.has(extname(file)));
const css = files.filter((file) => extname(file) === '.css').map((file) => readFileSync(file, 'utf8')).join('\n');
const declared = new Set([...css.matchAll(/--([a-z0-9-]+)\s*:/gi)].map((match) => match[1]));
const failures = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const displayPath = relative(root, file);

  if (!file.startsWith(tokenRoot) && /#[0-9a-f]{3,8}\b|rgba?\(/i.test(content)) {
    failures.push(`${displayPath}: raw color found outside styles/tokens`);
  }

  if (/var\(--(?:ink|muted|paper|surface|line|accent|accent-deep|accent-soft|danger|danger-soft)\)/.test(content)) {
    failures.push(`${displayPath}: legacy compatibility token found`);
  }

  for (const match of content.matchAll(/var\(--([a-z0-9-]+)/gi)) {
    if (!declared.has(match[1])) failures.push(`${displayPath}: --${match[1]} is not declared`);
  }
}

const brandConfig = readFileSync(join(sourceRoot, 'lib', 'brand', 'brand.config.ts'), 'utf8');
const brandTokens = readFileSync(join(tokenRoot, 'brands.css'), 'utf8');
for (const match of brandConfig.matchAll(/id:\s*'([^']+)'/g)) {
  if (!brandTokens.includes(`[data-brand='${match[1]}']`)) {
    failures.push(`styles/tokens/brands.css: missing primitives for brand "${match[1]}"`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Design tokens valid: ${declared.size} declarations across ${files.length} source files.`);
