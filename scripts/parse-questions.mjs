import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "../data/questions-source.txt"), "utf8");
const TOPICS = JSON.parse(readFileSync(join(__dirname, "../data/topics.json"), "utf8"));

const METRICS_CASE_NUMBERS = new Set([
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265
]);

function getTopic(num) {
    for (const t of TOPICS) {
        if (num <= t.maxQuestion) return t.name;
    }
    return TOPICS[TOPICS.length - 1].name;
}

function normalizeMode(value) {
    if (!value) return undefined;
    const raw = value.toLowerCase().trim();
    if (raw === "кейс" || raw === "кейсы") return "кейс";
    if (raw === "определение" || raw === "определения") return "определение";
    return undefined;
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
        let topicOverride = null;
        let modeOverride = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const optMatch = line.match(/^([A-D])\)\s*(.+)/);
            if (optMatch) {
                options.push(optMatch[2]);
                continue;
            }
            if (line.startsWith("*Тема:*")) {
                topicOverride = line.replace("*Тема:*", "").trim();
                continue;
            }
            if (line.startsWith("*Формат:*")) {
                modeOverride = normalizeMode(line.replace("*Формат:*", "").trim());
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

        const topic = topicOverride || getTopic(num);
        let mode = modeOverride;
        if (topic === "Метрики" && !mode) {
            mode = METRICS_CASE_NUMBERS.has(num) ? "кейс" : "определение";
        }

        const question = {
            topic,
            question: titleLine,
            options,
            correct,
            explanation,
            example: example || undefined
        };

        if (mode) question.mode = mode;

        questions.push(question);
    }

    return questions;
}

const questions = parseQuestions(source);

const seen = new Set();
for (const q of questions) {
    const key = `${q.topic}::${q.mode || ""}::${q.question}`;
    if (seen.has(key)) console.warn(`Duplicate question: ${q.question.slice(0, 60)}`);
    seen.add(key);
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
