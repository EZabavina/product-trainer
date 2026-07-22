/**
 * Убирает артефакты balance-distractors: (seed N), «Отсюда ложный ответ…» и т.п.
 * Для таких вариантов восстанавливает текст из коммита 6736ba7 (чистые дистракторы).
 */
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const questionsPath = join(root, "js/questions.js");
const sourcePath = join(root, "data/questions-source.txt");
const CLEAN_COMMIT = "6736ba7";

const JUNK =
    /\(seed \d+\)|Отсюда ложный ответ|не стоит выбирать|ошибочно берут|уводит от верного критерия|Не выбирайте «|Итог — «|Частая ошибка:|Так появляется ошибка вокруг|выбирают неверный критерий|не совпадает с нужным критерием/;

function loadQuestions(raw) {
    return JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));
}

const current = loadQuestions(readFileSync(questionsPath, "utf8"));
const cleanRaw = execSync(`git show ${CLEAN_COMMIT}:js/questions.js`, {
    cwd: root,
    encoding: "utf8"
});
const cleanById = new Map(loadQuestions(cleanRaw).map((q) => [q.id, q]));

let restored = 0;
for (const q of current) {
    const clean = cleanById.get(q.id);
    if (!clean) continue;
    q.options = q.options.map((opt, i) => {
        if (i === q.correct) return opt;
        if (!JUNK.test(opt)) return opt;
        restored++;
        return clean.options[i];
    });
}

writeFileSync(questionsPath, `const QUESTIONS = ${JSON.stringify(current, null, 4)};\n`);

const byId = new Map(current.map((q) => [String(q.id), q]));
let source = readFileSync(sourcePath, "utf8");
source = source.replace(
    /\*\*(\d+)\.\s*(.+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*\d+\.|$)/g,
    (block, num, title, body) => {
        const q = byId.get(String(num));
        if (!q) return block;
        const lines = body.split("\n");
        const newLines = [];
        let optIdx = 0;
        for (const line of lines) {
            const m = line.match(/^([A-D])\)\s*(.+)/);
            if (m && optIdx < 4) newLines.push(`${m[1]}) ${q.options[optIdx++]}`);
            else newLines.push(line);
        }
        return `**${num}. ${title.trim()}**\n${newLines.join("\n")}`;
    }
);
writeFileSync(sourcePath, source);

execSync("node scripts/parse-questions.mjs", { cwd: root, stdio: "inherit" });
execSync("node scripts/validate-questions.mjs", { cwd: root, stdio: "inherit" });

const left = current.reduce(
    (n, q) => n + q.options.filter((o, i) => i !== q.correct && JUNK.test(o)).length,
    0
);
console.log({ restored, junkLeft: left });
