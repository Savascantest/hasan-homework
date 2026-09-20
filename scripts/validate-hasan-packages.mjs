import { listHomeworkFiles } from './lib/homework-files.mjs';

const packages = await listHomeworkFiles();
if (packages.length !== 2) throw new Error(`Expected exactly two genuine Hasan packages, found ${packages.length}.`);
for (const {data, file} of packages) {
  const ids = data.quiz?.map((question) => question.id) ?? [];
  const prompts = data.quiz?.map((question) => question.prompt) ?? [];
  if (new Set(ids).size !== ids.length || ids.some((id) => typeof id !== 'string' || !id.trim())) throw new Error(`${file}: quiz IDs must be unique.`);
  if (new Set(prompts).size !== prompts.length || prompts.some((prompt) => typeof prompt !== 'string' || !prompt.trim())) throw new Error(`${file}: quiz prompts must be unique.`);
  const positions = [];
  for (const question of data.quiz ?? []) {
    if (!Array.isArray(question.choices) || question.choices.length < 2) throw new Error(`${file}: each question needs at least two choices.`);
    if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex >= question.choices.length) throw new Error(`${file}: invalid answer index in ${question.id}.`);
    positions.push(question.answerIndex);
  }
  const counts = positions.reduce((result, position) => ({ ...result, [position]: (result[position] ?? 0) + 1 }), {});
  const max = Math.max(...Object.values(counts));
  if (max > Math.ceil(positions.length / 2)) throw new Error(`${file}: answer positions are too concentrated.`);
}
console.log(`Validated Hasan package structure and answer distribution for ${packages.length} packages.`);
