import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOPICS = JSON.parse(readFileSync(join(__dirname, "../data/topics.json"), "utf8"));

const METRICS_CASE_NUMBERS = new Set([
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265
]);

const METRICS_MODES = new Set(["определение", "кейс"]);

export function getTopics() {
    return TOPICS;
}

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

export function parseQuestions(text) {
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
            continue;
        }

        const topic = topicOverride || getTopic(num);
        let mode = modeOverride;
        if (topic === "Метрики" && !mode) {
            mode = METRICS_CASE_NUMBERS.has(num) ? "кейс" : "определение";
        }

        const question = {
            id: num,
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

export function validateQuestions(questions) {
    const errors = [];
    const warnings = [];
    const topicNames = new Set(TOPICS.map((t) => t.name));
    const ids = new Set();
    const textKeys = new Set();
    const byTopic = {};

    for (const q of questions) {
        const label = `Q${q.id}`;

        if (!q.id) errors.push(`${label}: missing id`);
        if (ids.has(q.id)) errors.push(`${label}: duplicate id ${q.id}`);
        ids.add(q.id);

        if (!q.topic || !topicNames.has(q.topic)) {
            errors.push(`${label}: unknown topic "${q.topic}"`);
        }

        if (!q.question?.trim()) errors.push(`${label}: empty question text`);

        if (!Array.isArray(q.options) || q.options.length !== 4) {
            errors.push(`${label}: expected 4 options, got ${q.options?.length ?? 0}`);
        } else {
            q.options.forEach((opt, i) => {
                if (!String(opt).trim()) errors.push(`${label}: option ${i + 1} is empty`);
            });
        }

        if (q.correct < 0 || q.correct > 3) {
            errors.push(`${label}: correct index out of range (${q.correct})`);
        }

        if (!q.explanation?.trim()) errors.push(`${label}: missing explanation`);

        const textKey = `${q.topic}::${q.mode || ""}::${q.question}`;
        if (textKeys.has(textKey)) errors.push(`${label}: duplicate question text`);
        textKeys.add(textKey);

        if (q.topic === "Метрики") {
            if (!q.mode || !METRICS_MODES.has(q.mode)) {
                errors.push(`${label}: metrics question must have mode "определение" or "кейс"`);
            }
        } else if (q.mode) {
            warnings.push(`${label}: mode set for non-metrics topic (ignored in app)`);
        }

        byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
    }

    for (const t of TOPICS) {
        if (!byTopic[t.name]) {
            errors.push(`Topic "${t.name}" has no questions`);
        }
    }

    if (questions.length === 0) {
        errors.push("No questions parsed");
    }

    return { errors, warnings, byTopic };
}
