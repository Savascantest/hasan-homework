import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createBrowserProgress } from '../src/browser-progress.mjs';
import { assertHomeworkPackageEnvelope, HomeworkPackageContractError, INDEX_FIELDS } from '../scripts/lib/package-contract.mjs';
import { assertPublicPackagePrivacy, PublicPackagePrivacyError } from '../scripts/lib/public-package-privacy.mjs';

const root = resolve(import.meta.dirname, '..');
const syntheticPath = join(root, 'public/homeworks/homework-2099-01-15-synthetic-planet/homework.json');
const scaffoldMode = JSON.parse(readFileSync(join(root, 'config/scaffold-mode.json'), 'utf8'));
const synthetic = existsSync(syntheticPath)
  ? JSON.parse(readFileSync(syntheticPath, 'utf8'))
  : {
      id: '2099-01-15-safefixture', date: '2099-01-15', title: 'Contract fixture',
      policyVersion: scaffoldMode.policyVersion, templateContractVersion: scaffoldMode.templateContractVersion,
    };
const run = (script) => execFileSync(process.execPath, [join(root, script)], { cwd: root, encoding: 'utf8' });

test('clean synthetic package passes the envelope and strict privacy contracts', () => {
  assert.equal(assertHomeworkPackageEnvelope(synthetic).id, synthetic.id);
  assert.equal(assertPublicPackagePrivacy(synthetic).id, synthetic.id);
});

test('a missing required envelope field fails', () => {
  const broken = { ...synthetic };
  delete broken.policyVersion;
  assert.throws(() => assertHomeworkPackageEnvelope(broken), HomeworkPackageContractError);
});

test('a prohibited private field fails', () => {
  assert.throws(() => assertPublicPackagePrivacy({ ...synthetic, teacherNote: 'private' }), PublicPackagePrivacyError);
});

test('recursive privacy rejects operational, LessonRecord, planning, and source metadata', () => {
  for (const field of ['meetingUuid', 'lessonRecordPath', 'routerRun', 'executionReceipt', 'privatePlanning', 'sourceHash']) {
    assert.throws(() => assertPublicPackagePrivacy({ ...synthetic, content: { [field]: 'private' } }), PublicPackagePrivacyError, field);
  }
  assert.throws(() => assertPublicPackagePrivacy({ ...synthetic, resource: 'C:/Users/example/work/private/lesson.json' }), PublicPackagePrivacyError);
});

test('a UUID-shaped identifier fails even under a benign field', () => {
  assert.throws(() => assertPublicPackagePrivacy({ ...synthetic, id: 'homework-8f98e0b1-c101-4f8e-8f01-0f22bfe04f3c' }), PublicPackagePrivacyError);
});

test('a safe opaque public ID passes', () => {
  assert.equal(assertPublicPackagePrivacy({ ...synthetic, id: '2099-01-16-amberroutemap' }).id, '2099-01-16-amberroutemap');
});

test('the generated index contains only the whitelist', () => {
  run('scripts/build-homework-index.mjs');
  const index = JSON.parse(readFileSync(join(root, 'public/homeworks/index.json'), 'utf8'));
  assert.equal(index.packages.length, 2);
  if (index.packages.length) {
    assert.deepEqual(Object.keys(index.packages[0]).sort(), [...INDEX_FIELDS].sort());
    assert.equal(Object.hasOwn(index.packages[0], 'lessonNotes'), false);
  }
});

test('the private work path is narrowly ignored', () => {
  const ignore = readFileSync(join(root, '.gitignore'), 'utf8');
  assert.match(ignore, /^\/work\/private\/$/m);
  assert.doesNotMatch(ignore, /^\/work\/$/m);
});

test('the package records its policy version', () => {
  assert.equal(synthetic.policyVersion, scaffoldMode.policyVersion);
});

test('the package records its template contract version', () => {
  assert.equal(synthetic.templateContractVersion, scaffoldMode.templateContractVersion);
});

test('BrowserProgress remains namespaced and local-only', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const progress = createBrowserProgress({ studentNamespace: 'fictional-learner', packageId: synthetic.id, storage });
  progress.markComplete('learn');
  progress.saveAnswer('practice', 'A fictional answer', 1);
  progress.saveDraft('example', 'My own example');
  assert.match(progress.key, /^student-homework:fictional-learner:/);
  assert.deepEqual(progress.read().completion, { learn: true });
  assert.equal(values.size, 1);
  assert.deepEqual(progress.reset(), { completion: {}, answers: {}, drafts: {} });
  assert.equal(values.size, 0);
});

test('the configured archive builds into a public Pages artifact', () => {
  run('scripts/build.mjs');
  assert.equal(existsSync(join(root, 'dist/homeworks/index.json')), true);
  assert.equal(existsSync(join(root, 'dist/homeworks/2026-09-15-amberlighthouse/homework.json')), true);
  assert.equal(existsSync(join(root, 'dist/homeworks/homework-2099-01-15-synthetic-planet/homework.json')), false);
});

test('the clean baseline has no legacy-debt mechanism', () => {
  assert.equal(existsSync(join(root, 'scripts/fixtures/legacy-public-package-privacy-debt.json')), false);
  const validator = readFileSync(join(root, 'scripts/validate-public-package-privacy.mjs'), 'utf8');
  assert.doesNotMatch(validator, /PUBLIC_PACKAGE_PRIVACY_BASE|legacy/i);
});
