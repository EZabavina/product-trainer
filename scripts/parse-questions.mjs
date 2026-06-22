import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "../data/questions-source.txt"), "utf8");
const TOPICS = JSON.parse(readFileSync(join(__dirname, "../data/topics.json"), "utf8"));

function getTopic(num) {
    for (const t of TOPICS) {
        if (num <= t.maxQuestion) return t.name;
    }
    return TOPICS[TOPICS.length - 1].name;
}

function parseQuestions(text) {
    const questions = [];
    const regex = /\*\*(\d+)\.\s*(.+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*\d+\.|$)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const num = parseInt(match[1], 10);
        const titleLine = match[2].trim();
        const lines = match[3].split("\n").map((l) => l.trim()).filter(Boolean);

        const options = [];
        let correct = -1;
        let explanation = "";
        let example = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const optMatch = line.match(/^([A-D])\)\s*(.+)/);
            if (optMatch) {
                options.push(optMatch[2]);
                continue;
            }
            if (line.startsWith("*Верно:*")) {
                const correctLetter = line.match(/\*Верно:\*\s*([A-D])/);
                if (correctLetter) {
                    correct = correctLetter[1].charCodeAt(0) - 65;
                }
                const explMatch = line.match(/\*Объяснение:\*\s*(.+?)(?:\s*\*Пример:\*|$)/);
                if (explMatch) explanation = explMatch[1].trim();
                const exMatch = line.match(/\*Пример:\*\s*(.+)$/);
                if (exMatch) example = exMatch[1].trim();
            }
        }

        if (options.length !== 4 || correct < 0) {
            console.warn(`Skip Q${num}: options=${options.length} correct=${correct}`);
            continue;
        }

        questions.push({
            topic: getTopic(num),
            question: titleLine,
            options,
            correct,
            explanation,
            example: example || undefined
        });
    }

    return questions;
}

const questions = parseQuestions(source);

const seen = new Set();
for (const q of questions) {
    const key = `${q.topic}::${q.question}`;
    if (seen.has(key)) console.warn(`Duplicate question: ${q.question.slice(0, 60)}`);
    seen.add(key);
}

const out = `const QUESTIONS = ${JSON.stringify(questions, null, 4)};\n`;
writeFileSync(join(__dirname, "../js/questions.js"), out);
console.log(`Parsed ${questions.length} questions`);
const byTopic = {};
for (const q of questions) {
    byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
}
console.log(byTopic);
