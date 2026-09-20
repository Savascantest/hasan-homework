export function createBrowserProgress({ studentNamespace, packageId, storage = globalThis.localStorage } = {}) {
  if (!studentNamespace || !packageId || !storage) throw new Error('studentNamespace, packageId, and storage are required');
  const key = `student-homework:${studentNamespace}:${packageId}:progress`;
  const empty = () => ({ completion: {}, answers: {}, drafts: {} });
  const read = () => {
    const raw = storage.getItem(key);
    if (!raw) return empty();
    try { return { ...empty(), ...JSON.parse(raw) }; } catch { return empty(); }
  };
  const write = (next) => { storage.setItem(key, JSON.stringify(next)); return next; };
  return Object.freeze({
    key,
    read,
    markComplete(activityId, complete = true) { const next = read(); next.completion[activityId] = Boolean(complete); return write(next); },
    saveAnswer(activityId, answer, score) { const next = read(); next.answers[activityId] = { answer, ...(score === undefined ? {} : { score }) }; return write(next); },
    saveDraft(draftId, text) { const next = read(); next.drafts[draftId] = text; return write(next); },
    reset() { storage.removeItem(key); return empty(); },
  });
}
