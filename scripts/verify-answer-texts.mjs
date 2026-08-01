/**
 * Проверка пайплайна текстов ответа → Sheets.
 * Запуск: node scripts/verify-answer-texts.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUESTIONS = JSON.parse(
    readFileSync(join(root, "js/questions.js"), "utf8")
        .replace(/^const QUESTIONS = /, "")
        .replace(/;\s*$/, "")
);

const EVENT_HEADERS = [
    "receivedAt",
    "date",
    "type",
    "questionId",
    "correct",
    "selectedIndex",
    "questionText",
    "selectedText",
    "correctText",
    "topic",
    "mode",
    "quizType",
    "sessionId",
    "sessionLength",
    "score",
    "total",
    "percent",
    "source"
];

function buildEventRow(headers, event, source) {
    const values = {
        receivedAt: event.receivedAt || new Date().toISOString(),
        date: event.date || "",
        type: event.type || "",
        questionId: event.questionId != null ? event.questionId : "",
        correct: event.correct === true ? "TRUE" : event.correct === false ? "FALSE" : "",
        selectedIndex: event.selectedIndex != null ? event.selectedIndex : "",
        questionText: event.questionText != null ? String(event.questionText) : "",
        selectedText: event.selectedText != null ? String(event.selectedText) : "",
        correctText: event.correctText != null ? String(event.correctText) : "",
        topic: event.topic || "",
        mode: event.mode || "",
        quizType: event.quizType || "",
        sessionId: event.sessionId || "",
        sessionLength: event.sessionLength || "",
        score: event.score != null ? event.score : "",
        total: event.total != null ? event.total : "",
        percent: event.percent != null ? event.percent : "",
        source: source || "product-trainer"
    };
    return headers.map((name) => (Object.prototype.hasOwnProperty.call(values, name) ? values[name] : ""));
}

function textOrNull(value, max) {
    if (value == null) return null;
    const s = String(value).trim();
    if (!s) return null;
    return s.slice(0, max);
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

let failed = 0;
function check(name, fn) {
    try {
        fn();
        console.log("✓", name);
    } catch (err) {
        failed++;
        console.error("✗", name, "—", err.message);
    }
}

const q = QUESTIONS[0];
assert(q && q.options?.length >= 2, "need sample question");

const selectedIndex = q.correct === 0 ? 1 : 0;
const clientPayload = {
    type: "answer",
    questionId: q.id,
    correct: false,
    selectedIndex,
    questionText: q.question,
    selectedText: q.options[selectedIndex],
    correctText: q.options[q.correct],
    topic: q.topic,
    mode: q.mode || "определение",
    quizType: "topic",
    sessionId: "s_test",
    date: new Date().toISOString()
};

check("client payload has real question/answer texts", () => {
    assert(clientPayload.questionText.includes("?") || clientPayload.questionText.length > 10, "question too short");
    assert(clientPayload.selectedText.length > 0, "selectedText empty");
    assert(clientPayload.correctText.length > 0, "correctText empty");
    assert(clientPayload.selectedText !== clientPayload.correctText, "wrong vs correct should differ");
    assert(clientPayload.questionText !== clientPayload.topic, "questionText must not be topic");
    assert(!["Метрики", "JTBD", "CustDev"].includes(clientPayload.selectedText), "selectedText must not be topic");
});

check("API sanitize keeps texts", () => {
    const sanitized = {
        questionText: textOrNull(clientPayload.questionText, 500),
        selectedText: textOrNull(clientPayload.selectedText, 300),
        correctText: textOrNull(clientPayload.correctText, 300),
        topic: textOrNull(clientPayload.topic, 80)
    };
    assert(sanitized.questionText === clientPayload.questionText.slice(0, 500), "questionText lost");
    assert(sanitized.selectedText === clientPayload.selectedText.slice(0, 300), "selectedText lost");
    assert(sanitized.correctText === clientPayload.correctText.slice(0, 300), "correctText lost");
    assert(sanitized.topic === clientPayload.topic, "topic lost");
});

check("Sheets row maps texts into named columns", () => {
    const row = buildEventRow(EVENT_HEADERS, clientPayload, "product-trainer");
    const byHeader = Object.fromEntries(EVENT_HEADERS.map((h, i) => [h, row[i]]));
    assert(byHeader.questionText === clientPayload.questionText, "col questionText wrong");
    assert(byHeader.selectedText === clientPayload.selectedText, "col selectedText wrong");
    assert(byHeader.correctText === clientPayload.correctText, "col correctText wrong");
    assert(byHeader.topic === clientPayload.topic, "col topic wrong");
    assert(byHeader.questionText !== byHeader.topic, "questionText collided with topic");
});

check("Sheets row still correct if headers are reordered", () => {
    const shuffled = [
        "source",
        "topic",
        "questionText",
        "type",
        "selectedText",
        "correctText",
        "questionId",
        "correct",
        "selectedIndex",
        "mode",
        "quizType",
        "sessionId",
        "sessionLength",
        "score",
        "total",
        "percent",
        "receivedAt",
        "date"
    ];
    const row = buildEventRow(shuffled, clientPayload, "product-trainer");
    const byHeader = Object.fromEntries(shuffled.map((h, i) => [h, row[i]]));
    assert(byHeader.questionText === clientPayload.questionText, "reordered questionText");
    assert(byHeader.selectedText === clientPayload.selectedText, "reordered selectedText");
    assert(byHeader.correctText === clientPayload.correctText, "reordered correctText");
    assert(byHeader.topic === clientPayload.topic, "reordered topic");
});

check("old positional bug would put topic into questionText — detected", () => {
    // Simulate OLD appendRow without text fields under NEW headers
    const oldRow = [
        "2026-01-01",
        "2026-01-01",
        "answer",
        q.id,
        "FALSE",
        selectedIndex,
        q.topic, // ← wrongly lands in questionText
        q.mode || "определение",
        "topic",
        "s_1",
        "quick",
        0,
        1,
        0,
        "product-trainer"
    ];
    const byHeader = Object.fromEntries(EVENT_HEADERS.map((h, i) => [h, oldRow[i] ?? ""]));
    assert(byHeader.questionText === q.topic, "fixture should show the old bug");
    assert(KNOWN_TOPIC(byHeader.questionText), "fixture topic");
});

function KNOWN_TOPIC(v) {
    return ["Метрики", "Финансовая модель", "Юнит-экономика", "JTBD", "CustDev"].includes(v);
}

check("sample of 20 questions: options[correct] resolves", () => {
    for (const item of QUESTIONS.slice(0, 20)) {
        const correct = item.options[item.correct];
        assert(typeof correct === "string" && correct.length > 0, `Q${item.id} correct empty`);
        assert(typeof item.question === "string" && item.question.length > 0, `Q${item.id} question empty`);
    }
});

if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
}
console.log("\nAll answer-text checks passed.");
