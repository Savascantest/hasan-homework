import { listHomeworkFiles } from './lib/homework-files.mjs';
import { assertHomeworkPackageEnvelope } from './lib/package-contract.mjs';

const packages = await listHomeworkFiles();
for (const item of packages) assertHomeworkPackageEnvelope(item.data, item.file);
console.log(`Validated public package envelopes for ${packages.length} package(s).`);
