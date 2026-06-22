import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawnSync } from "child_process";
import { parseQuestions, validateQuestions } from "./question-parser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "../data/questions-source.txt"), "utf8");

const questions = parseQuestions(source);
const { errors, warnings } = validateQuestions(questions);

for (const w of warnings) {
    console.warn(`WARN: ${w}`);
}

if (errors.length > 0) {
    console.error(`Parse aborted: ${errors.length} validation error(s):`);
    for (const e of errors) {
        console.error(`  - ${e}`);
    }
    process.exit(1);
}

const out = `const QUESTIONS = ${JSON.stringify(questions, null, 4)};\n`;
writeFileSync(join(__dirname, "../js/questions.js"), out);
console.log(`Parsed ${questions.length} questions`);

const byTopic = {};
const byMode = {};
for (const q of questions) {
    byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
    if (q.mode) byMode[q.mode] = (byMode[q.mode] || 0) + 1;
}
console.log(byTopic);
console.log("Modes:", byMode);

const validate = spawnSync(process.execPath, [join(__dirname, "validate-questions.mjs")], {
    stdio: "inherit"
});
if (validate.status !== 0) {
    process.exit(validate.status ?? 1);
}
