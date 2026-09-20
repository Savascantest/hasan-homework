import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { listHomeworkFiles } from './lib/homework-files.mjs';
import { assertHomeworkPackageEnvelope, publicIndexEntry } from './lib/package-contract.mjs';
import { assertPublicPackagePrivacy } from './lib/public-package-privacy.mjs';

const packages = await listHomeworkFiles();
const index = { packages: packages
  .map((item) => {
    assertHomeworkPackageEnvelope(item.data, item.file);
    assertPublicPackagePrivacy(item.data, item.file);
    return publicIndexEntry(item.data, item.path);
  })
  .sort((left, right) => right.date.localeCompare(left.date) || left.id.localeCompare(right.id)) };

await mkdir(path.resolve('public/homeworks'), { recursive: true });
await writeFile(path.resolve('public/homeworks/index.json'), `${JSON.stringify(index, null, 2)}\n`);
console.log(`Generated privacy-safe index for ${index.packages.length} package(s).`);
