/**
 * Дополняет answer-события текстами вопроса/ответов по questionId.
 * Страховка: если клиент не прислал тексты, Sheets всё равно получит их.
 */
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

let questionsCache = null;

function loadQuestionsBank() {
    if (questionsCache) return questionsCache;

    const here = dirname(fileURLToPath(import.meta.url));
    const candidates = [
        join(here, "..", "js", "questions.js"),
        join(here, "questions.js"),
        join(process.cwd(), "js", "questions.js"),
        join(process.cwd(), "public", "js", "questions.js"),
        join(process.cwd(), "questions.js")
    ];

    for (const path of candidates) {
        if (!existsSync(path)) continue;
        try {
            const raw = readFileSync(path, "utf8");
            questionsCache = JSON.parse(
                raw.replace(/^const QUESTIONS\s*=\s*/, "").replace(/;?\s*$/, "")
            );
            console.log("[events] questions bank loaded:", path, "count=", questionsCache.length);
            return questionsCache;
        } catch (err) {
            console.warn("Failed to parse questions bank at", path, err?.message || err);
        }
    }

    console.warn("[events] questions bank NOT found; tried:", candidates.join(" | "));
    questionsCache = [];
    return questionsCache;
}

function asTrimmedString(value, max) {
    if (value == null) return "";
    const s = String(value).trim();
    if (!s) return "";
    return s.length > max ? s.slice(0, max) : s;
}

/**
 * @param {object} event
 * @returns {object}
 */
export function enrichAnswerTexts(event) {
    if (!event || event.type !== "answer") return event;

    let questionText = asTrimmedString(event.questionText, 500);
    let selectedText = asTrimmedString(event.selectedText, 300);
    let correctText = asTrimmedString(event.correctText, 300);

    if (questionText && selectedText && correctText) {
        return { ...event, questionText, selectedText, correctText };
    }

    const id = event.questionId;
    if (id == null || id === "") {
        return {
            ...event,
            questionText: questionText || null,
            selectedText: selectedText || null,
            correctText: correctText || null
        };
    }

    const idStr = String(id);
    if (idStr.startsWith("unit-calc:") || idStr.startsWith("unit-lab:")) {
        return {
            ...event,
            questionText: questionText || null,
            selectedText: selectedText || null,
            correctText: correctText || null
        };
    }

    const bank = loadQuestionsBank();
    const q = bank.find((item) => item.id === id || item.id === Number(id));
    if (!q) {
        console.warn("[events] answer without texts and question not found:", id);
        return {
            ...event,
            questionText: questionText || null,
            selectedText: selectedText || null,
            correctText: correctText || null
        };
    }

    if (!questionText) questionText = asTrimmedString(q.question, 500);
    if (!correctText) correctText = asTrimmedString(q.options?.[q.correct], 300);
    if (!selectedText && typeof event.selectedIndex === "number") {
        selectedText = asTrimmedString(q.options?.[event.selectedIndex], 300);
    }

    return {
        ...event,
        questionText: questionText || null,
        selectedText: selectedText || null,
        correctText: correctText || null,
        topic: event.topic || asTrimmedString(q.topic, 80) || null,
        mode: event.mode || asTrimmedString(q.mode, 40) || null
    };
}
