/**
 * DANGEROUS — disabled.
 * Жжёт дневной free-лимит OpenRouter и раньше давал нестабильные дистракторы.
 * Не запускать. См. scripts/fix-distractors.mjs
 */
console.error(`
rewrite-distractors-llm.mjs отключён.

Используйте:
  node scripts/fix-distractors.mjs
  node scripts/parse-questions.mjs

Если нужен LLM-прогон снова — временно уберите этот guard и следите за лимитом OpenRouter (50 free/день).
`);
process.exit(1);
