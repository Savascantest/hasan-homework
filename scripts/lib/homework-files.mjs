import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const HOMEWORKS_ROOT = path.resolve('public/homeworks');

export async function listHomeworkFiles() {
  const entries = await readdir(HOMEWORKS_ROOT, { withFileTypes: true });
  const packages = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = path.join(HOMEWORKS_ROOT, entry.name, 'homework.json');
    try {
      const raw = await readFile(file, 'utf8');
      packages.push({ file, path: `${entry.name}/homework.json`, data: JSON.parse(raw) });
    } catch (error) {
      throw new Error(`${file}: unreadable or invalid JSON (${error.message})`);
    }
  }
  return packages.sort((left, right) => right.path.localeCompare(left.path));
}
