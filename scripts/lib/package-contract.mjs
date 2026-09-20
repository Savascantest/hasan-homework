export const INDEX_FIELDS = Object.freeze(['id', 'date', 'title', 'path', 'policyVersion', 'templateContractVersion']);
export const REQUIRED_ENVELOPE_FIELDS = Object.freeze(['id', 'date', 'title', 'policyVersion', 'templateContractVersion']);

export class HomeworkPackageContractError extends Error {
  constructor(source, errors) {
    super(`${source}: package envelope validation failed:\n- ${errors.join('\n- ')}`);
    this.name = 'HomeworkPackageContractError';
    this.errors = errors;
  }
}

export function collectEnvelopeErrors(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['package must be a JSON object'];
  for (const field of REQUIRED_ENVELOPE_FIELDS) {
    if (typeof value[field] !== 'string' || value[field].trim() === '') errors.push(`${field} is required and must be a non-empty string`);
  }
  if (value.id && !/^\d{4}-\d{2}-\d{2}-[a-z0-9]{10,24}$/.test(value.id)) errors.push('id must use YYYY-MM-DD plus an opaque lowercase alphanumeric suffix');
  if (value.date && !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) errors.push('date must use YYYY-MM-DD');
  return errors;
}

export function assertHomeworkPackageEnvelope(value, source = 'HomeworkPackage') {
  const errors = collectEnvelopeErrors(value);
  if (errors.length) throw new HomeworkPackageContractError(source, errors);
  return value;
}

export function publicIndexEntry(packageData, packagePath) {
  return Object.fromEntries(INDEX_FIELDS.map((field) => [field, field === 'path' ? packagePath : packageData[field]]));
}
