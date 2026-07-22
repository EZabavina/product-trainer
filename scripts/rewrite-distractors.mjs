/**
 * DANGEROUS — disabled.
 * Раньше добивал короткие неверные ответы одинаковыми хвостами.
 * Не запускать. См. scripts/fix-distractors.mjs
 */
console.error(`
rewrite-distractors.mjs отключён (шаблонные хвосты / expandBareLabel).

Используйте:
  node scripts/fix-distractors.mjs
  node scripts/parse-questions.mjs
`);
process.exit(1);
