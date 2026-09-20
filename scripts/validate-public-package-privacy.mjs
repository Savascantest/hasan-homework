import { listHomeworkFiles } from './lib/homework-files.mjs';
import { assertPublicPackagePrivacy } from './lib/public-package-privacy.mjs';

const packages = await listHomeworkFiles();
for (const item of packages) assertPublicPackagePrivacy(item.data, item.file);
console.log(`Validated strict public-package privacy for ${packages.length} package(s).`);
