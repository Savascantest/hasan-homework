import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dossierValidator = resolve('work/private/architecture-v1/validate-dossier.mjs');
if (existsSync(dossierValidator)) {
  await import(new URL(`file:///${dossierValidator.replaceAll('\\', '/')}`));
} else {
  console.log('Private dossier is intentionally unavailable in the public build environment.');
}
