import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { listHomeworkFiles } from './lib/homework-files.mjs';
import { assertHomeworkPackageEnvelope } from './lib/package-contract.mjs';
import { assertPublicPackagePrivacy } from './lib/public-package-privacy.mjs';

await import('./build-homework-index.mjs');
const packages = await listHomeworkFiles();
for (const item of packages) {
  assertHomeworkPackageEnvelope(item.data, item.file);
  assertPublicPackagePrivacy(item.data, item.file);
}
const dist = path.resolve('dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.resolve('public'), dist, { recursive: true });
console.log(`Built Pages artifact with ${packages.length} privacy-validated package(s).`);
