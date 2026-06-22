import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { parseQuestions, validateQuestions } from "./question-parser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "../data/questions-source.txt"), "utf8");

const questions = parseQuestions(source);
const { errors, warnings, byTopic } = validateQuestions(questions);

for (const w of warnings) {
    console.warn(`WARN: ${w}`);
}

if (errors.length > 0) {
    console.error(`Validation failed (${errors.length} error(s)):`);
    for (const e of errors) {
        console.error(`  - ${e}`);
    }
    process.exit(1);
}

console.log(`Validated ${questions.length} questions`);
console.log(byTopic);
process.exit(0);
