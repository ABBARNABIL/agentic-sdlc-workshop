import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
const notices = ['Third-party notices for the Agentic SDLC workshop guide', 'This file is generated from the locked, installed site dependencies. It includes build tools as well as browser-distributed libraries. The imported workshop has its own preserved Microsoft MIT notice at /agentic-sdlc-workshop/about/.'];
let fontIncluded = false;
for (const [relative, metadata] of Object.entries(lock.packages)) {
  if (!relative.startsWith('node_modules/')) continue;
  const directory = path.join(root, relative);
  if (!existsSync(directory)) continue;
  const names = await readdir(directory);
  const licenseNames = names.filter(name => /^(?:licen[sc]e|copying|notice)(?:[.-].*)?$/i.test(name));
  const label = `${relative.replace(/^node_modules\//, '')}@${metadata.version}`;
  notices.push(`\n${'='.repeat(72)}\n${label}\nDeclared license: ${metadata.license ?? 'see package metadata'}\n`);
  for (const name of licenseNames) {
    const file = path.join(directory, name);
    if (!(await stat(file)).isFile()) continue;
    notices.push(`--- ${name} ---\n${await readFile(file, 'utf8')}`);
    if (relative === 'node_modules/@fontsource/atkinson-hyperlegible') fontIncluded = true;
  }
  if (!licenseNames.length) notices.push(`No standalone notice file was present. Package metadata: https://www.npmjs.com/package/${relative.split('node_modules/').at(-1)}`);
}
if (!fontIncluded) throw new Error('The original Atkinson Hyperlegible font license must be distributed with the site');
await writeFile(path.join(root, 'public', 'third-party-notices.txt'), `${notices.join('\n')}\n`);
console.log('Generated third-party notices, including the complete original font license.');
