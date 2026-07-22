/**
 * DANGEROUS — disabled.
 * Старый локальный rewrite навешивал шаблонные хвосты и делал git checkout.
 * Используйте scripts/fix-distractors.mjs (strip + checkpoint) при необходимости.
 */
console.error(`
rewrite-distractors-local.mjs отключён.

Он портил неверные ответы шаблонными фразами и мог откатить js/questions.js через git checkout.

Что делать вместо этого:
  node scripts/fix-distractors.mjs

Или правьте data/questions-source.txt вручную и соберите:
  node scripts/parse-questions.mjs
`);
process.exit(1);
