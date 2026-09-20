const PROHIBITED = new Map([
  ['meetinguuid', 'raw meeting UUID'], ['rawmeetinguuid', 'raw meeting UUID'],
  ['meetingid', 'raw meeting ID'], ['rawmeetingid', 'raw meeting ID'], ['meetingnumber', 'raw meeting ID'],
  ['transcript', 'transcript content'], ['transcriptitems', 'transcript items'],
  ['transcriptpath', 'private transcript path'], ['transcripthash', 'transcript hash'],
  ['sourcehash', 'private source hash'], ['contenthash', 'private source hash'],
  ['teachernote', 'private teacher note'], ['teachernotes', 'private teacher notes'],
  ['sourceevidence', 'private source evidence'], ['privatesourceevidence', 'private source evidence'],
  ['teacherevidence', 'private teacher evidence'], ['privateteacherevidence', 'private teacher evidence'],
  ['lessonrecord', 'private LessonRecord reference'], ['lessonrecordpath', 'private LessonRecord reference'],
  ['routerrun', 'private router state'], ['routerstate', 'private router state'],
  ['executionreceipt', 'private execution evidence'], ['validationreport', 'private execution evidence'],
  ['studentprofile', 'private StudentProfile'], ['learnerstate', 'private LearnerState'],
  ['participantmetadata', 'private participant metadata'], ['taskid', 'private task identifier'],
  ['privateplanning', 'private planning metadata'], ['planningrecord', 'private planning metadata'],
]);
const UUID_LIKE = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export class PublicPackagePrivacyError extends Error {
  constructor(source, violations) {
    super(`${source}: public package privacy validation failed:\n- ${violations.join('\n- ')}`);
    this.name = 'PublicPackagePrivacyError';
    this.violations = violations;
  }
}

export function normalizeFieldName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function prohibitedReason(field) {
  const name = normalizeFieldName(field);
  if (PROHIBITED.has(name)) return PROHIBITED.get(name);
  if (/meeting(?:uuid|id|number)$/.test(name)) return 'raw meeting identifier';
  if (name.includes('transcript')) return 'transcript content or metadata';
  if (name.includes('lessonrecord')) return 'private LessonRecord reference';
  if (name.includes('router')) return 'private router state';
  if (name.includes('planning') && name.includes('private')) return 'private planning metadata';
  if (name.includes('source') && name.includes('hash')) return 'private source hash';
  if (/teacher(?:source)?notes?$/.test(name)) return 'private teacher note';
  if (name.includes('evidence') && /(private|source|teacher|execution)/.test(name)) return 'private evidence';
  if (name.includes('participant') && name.includes('metadata')) return 'private participant metadata';
  if (name.includes('learnerstate') || name.includes('studentprofile')) return 'private learner record';
  return undefined;
}

export function collectPublicPackagePrivacyViolations(value, location = '$') {
  const violations = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => violations.push(...collectPublicPackagePrivacyViolations(item, `${location}[${index}]`)));
  } else if (value && typeof value === 'object') {
    for (const [field, item] of Object.entries(value)) {
      const child = `${location}.${field}`;
      const reason = prohibitedReason(field);
      if (reason) violations.push(`${child}: prohibited ${reason} field`);
      violations.push(...collectPublicPackagePrivacyViolations(item, child));
    }
  } else if (typeof value === 'string') {
    if (UUID_LIKE.test(value)) violations.push(`${location}: UUID-shaped source identifier in public value`);
    const normalized = value.toLowerCase().replaceAll('\\', '/');
    if (normalized.includes('/private/') || normalized.includes('private-transcript') || /^[a-z]:\/users\//.test(normalized)) {
      violations.push(`${location}: private source path/value`);
    }
  }
  return violations;
}

export function assertPublicPackagePrivacy(value, source = 'HomeworkPackage') {
  const violations = collectPublicPackagePrivacyViolations(value);
  if (violations.length) throw new PublicPackagePrivacyError(source, violations);
  return value;
}
