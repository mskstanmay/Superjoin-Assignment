import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { compile } from 'json-schema-to-typescript';

const root = new URL('../shared/', import.meta.url);
const files = (await readdir(new URL('contracts/', root))).filter(f => f.endsWith('.json')).sort();
await mkdir(new URL('types/', root), { recursive: true });
for (const file of files) {
  const name = file.slice(0, -5);
  const schema = JSON.parse(await readFile(new URL(`contracts/${file}`, root), 'utf8'));
  const content = await compile(schema, name, { bannerComment: '/* Generated from shared/contracts; do not edit. */' });
  const target = new URL(`types/${name}.d.ts`, root);
  if (process.argv.includes('--check')) {
    if (await readFile(target, 'utf8') !== content) throw new Error(`Type drift: ${name}`);
  } else await writeFile(target, content);
}
const index = files.map(f => `export type { ${f.slice(0, -5)} } from './${f.slice(0, -5)}.js';`).join('\n')
  + '\nexport declare function validateContract(name: string, data: unknown): unknown;\n';
const indexPath = new URL('types/index.d.ts', root);
if (process.argv.includes('--check')) {
  if (await readFile(indexPath, 'utf8') !== index) throw new Error('Type index drift');
} else await writeFile(indexPath, index);
console.log(`${files.length} TypeScript contracts checked/generated`);
