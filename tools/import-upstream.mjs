import { createHash } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const commit = 'ee974780023dbc9670817a639e1d8e8fa840a6c6';
const treeSha = '8173c5a2ae5a396662a345e90e4013f5cadae0ac';
const subtree = '03-Azure/01-04-AI/01_Agentic_SDLC';
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--output') {
  throw new Error('Usage: node tools/import-upstream.mjs --output <new-staging-directory>');
}
const output = path.resolve(args[1]);
try {
  await access(output);
  throw new Error(`Refusing to overwrite an existing directory: ${output}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const response = await fetch(`https://api.github.com/repos/microsoft/MicroHack/git/trees/${treeSha}?recursive=1`, {
  headers: { 'User-Agent': 'agentic-sdlc-workshop-import' },
});
if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
const manifest = await response.json();
if (manifest.sha !== treeSha || manifest.truncated) throw new Error('Unexpected or truncated upstream tree');
const files = manifest.tree.filter(entry => entry.type === 'blob');
if (files.length !== 278 || files.some(file => file.size > 5_000_000) || files.reduce((sum, file) => sum + file.size, 0) > 30_000_000) {
  throw new Error('Unexpected import size; review the pin and bounds before downloading');
}
await mkdir(output);
let cursor = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < files.length) {
    const file = files[cursor++];
    if (!['100644', '100755'].includes(file.mode) || file.path.split('/').some(part => part === '..')) {
      throw new Error(`Unsupported upstream path or mode: ${file.path}`);
    }
    const result = await fetch(`https://raw.githubusercontent.com/microsoft/MicroHack/${commit}/${subtree}/${file.path}`);
    if (!result.ok) throw new Error(`Download failed: ${result.status} ${file.path}`);
    const bytes = Buffer.from(await result.arrayBuffer());
    const actual = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (bytes.length !== file.size || actual !== file.sha) throw new Error(`Blob verification failed: ${file.path}`);
    const target = path.join(output, ...file.path.split('/'));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes, { mode: file.mode === '100755' ? 0o755 : 0o644 });
  }
}));
const license = await fetch(`https://raw.githubusercontent.com/microsoft/MicroHack/${commit}/LICENSE`);
if (!license.ok) throw new Error(`License download failed: ${license.status}`);
await writeFile(path.join(output, 'LICENSE.upstream'), await license.text());
await writeFile(path.join(output, 'upstream-tree.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Verified ${files.length} files at ${commit}. Staged only in ${output}; review before applying.`);
