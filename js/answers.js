/**
 * Журнал ответов по вопросам (localStorage) + опциональная отправка на /api/events.
 */
const ANSWERS_KEY = "product-trainer-answers";
const MAX_ANSWER_EVENTS = 5000;
const EVENTS_API_URL = "/api/events";

function loadAnswerLog() {
    try {
        const raw = localStorage.getItem(ANSWERS_KEY);
        return raw ? JSON.parse(raw) : { events: [] };
    } catch {
        return { events: [] };
    }
}

function saveAnswerLog(data) {
    if (data.events.length > MAX_ANSWER_EVENTS) {
        data.events = data.events.slice(-MAX_ANSWER_EVENTS);
    }
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(data));
}

function clearAnswerLog() {
    localStorage.removeItem(ANSWERS_KEY);
}

function createQuizSessionId() {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

function optionLetter(index) {
    return typeof index === "number" && index >= 0 && index < OPTION_LETTERS.length
        ? OPTION_LETTERS[index]
        : "";
}

function trimEventText(value, maxLen) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen - 1)}…` : trimmed;
}

/** Для ответа в Sheets всегда строка (не null) — иначе GAS пишет пусто. */
function requiredEventText(value, maxLen) {
    return trimEventText(value, maxLen) || "";
}

/**
 * Тексты вопроса и ответов для экспорта / старых событий без questionText.
 */
function lookupAnswerEventLabels(event) {
    const id = event.questionId;
    if (id == null) {
        return { questionText: "", selectedText: "", correctText: "" };
    }

    const q =
        typeof QUESTIONS !== "undefined"
            ? QUESTIONS.find((item) => item.id === id || item.id === Number(id))
            : null;
    if (q) {
        return {
            questionText: q.question,
            selectedText:
                typeof event.selectedIndex === "number"
                    ? q.options[event.selectedIndex] || ""
                    : "",
            correctText: q.options[q.correct] || ""
        };
    }

    const calc =
        typeof UNIT_CALC_SCENARIOS !== "undefined"
            ? UNIT_CALC_SCENARIOS.find((item) => `unit-calc:${item.id}` === String(id))
            : null;
    if (calc) {
        return {
            questionText: calc.brief ? `${calc.title}: ${calc.brief}` : calc.title,
            selectedText: "",
            correctText: (calc.ask || [])
                .map((a) => `${a.label}: ${a.answer}`)
                .join("; ")
        };
    }

    const lab =
        typeof UNIT_LAB_CHALLENGES !== "undefined"
            ? UNIT_LAB_CHALLENGES.find((item) => `unit-lab:${item.id}` === String(id))
            : null;
    if (lab) {
        return {
            questionText: lab.prompt ? `${lab.title}: ${lab.prompt}` : lab.title,
            selectedText: "",
            correctText: ""
        };
    }

    return { questionText: `Вопрос #${id}`, selectedText: "", correctText: "" };
}

function resolveAnswerEventLabels(event) {
    const fromLookup = lookupAnswerEventLabels(event);
    return {
        questionText: (event && event.questionText) || fromLookup.questionText || "",
        selectedText: (event && event.selectedText) || fromLookup.selectedText || "",
        correctText: (event && event.correctText) || fromLookup.correctText || ""
    };
}

/**
 * Записать исход одного ответа.
 * Всегда кладёт тексты вопроса / выбранного / верного ответа.
 * @returns {object} event
 */
function recordAnswerOutcome(payload) {
    const labels = resolveAnswerEventLabels(payload || {});
    const event = {
        id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "answer",
        questionId: payload.questionId,
        correct: Boolean(payload.correct),
        selectedIndex:
            typeof payload.selectedIndex === "number" ? payload.selectedIndex : null,
        questionText: requiredEventText(labels.questionText, 500),
        selectedText: requiredEventText(labels.selectedText, 300),
        correctText: requiredEventText(labels.correctText, 300),
        topic: payload.topic || null,
        mode: payload.mode || null,
        quizType: payload.quizType || "topic",
        sessionId: payload.sessionId || null,
        sessionLength: payload.sessionLength || null,
        score: typeof payload.score === "number" ? payload.score : null,
        total: typeof payload.total === "number" ? payload.total : null,
        percent: typeof payload.percent === "number" ? payload.percent : null,
        date: new Date().toISOString()
    };

    if (!event.questionText || !event.correctText) {
        console.warn("[answers] missing texts for questionId", event.questionId, event);
    }

    const data = loadAnswerLog();
    data.events.push(event);
    saveAnswerLog(data);
    sendAnalyticsEvent(event);
    return event;
}

function recordSessionOutcome(payload) {
    const event = {
        id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "session",
        topic: payload.topic || null,
        mode: payload.mode || null,
        quizType: payload.quizType || "topic",
        sessionId: payload.sessionId || null,
        sessionLength: payload.sessionLength || null,
        score: payload.score ?? null,
        total: payload.total ?? null,
        percent: payload.percent ?? null,
        date: new Date().toISOString()
    };

    const data = loadAnswerLog();
    data.events.push(event);
    saveAnswerLog(data);
    sendAnalyticsEvent(event);
    return event;
}

const LIFECYCLE_EVENT_TYPES = new Set([
    "session_start",
    "question_view",
    "session_exit",
    "session_complete"
]);

function recordLifecycleEvent(payload) {
    const type = payload.type;
    if (!LIFECYCLE_EVENT_TYPES.has(type)) return null;

    const event = {
        id: `lc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        route: payload.route || null,
        formatSlug: payload.formatSlug || null,
        topicSlug: payload.topicSlug || null,
        topic: payload.topic || null,
        mode: payload.mode || null,
        quizType: payload.quizType || null,
        sessionId: payload.sessionId || null,
        sessionLength: payload.sessionLength || null,
        questionIndex: payload.questionIndex ?? null,
        questionId: payload.questionId ?? null,
        exitReason: payload.exitReason || null,
        plannedQuestions: payload.plannedQuestions ?? null,
        answeredCount: payload.answeredCount ?? null,
        score: payload.score ?? null,
        total: payload.total ?? null,
        percent: payload.percent ?? null,
        date: new Date().toISOString()
    };

    const data = loadAnswerLog();
    data.events.push(event);
    saveAnswerLog(data);
    sendAnalyticsEvent(event);
    return event;
}

function sendAnalyticsEvent(event) {
    try {
        if (typeof trackMetrika === "function") {
            if (event.type === "answer") {
                trackMetrika("quiz_answer", {
                    question_id: event.questionId,
                    correct: event.correct ? 1 : 0,
                    topic: event.topic || "",
                    quiz_type: event.quizType || ""
                });
            } else if (event.type === "session") {
                trackMetrika("quiz_complete", {
                    topic: event.topic || "",
                    quiz_type: event.quizType || "",
                    percent: event.percent ?? 0,
                    score: event.score ?? 0,
                    total: event.total ?? 0
                });
            } else if (LIFECYCLE_EVENT_TYPES.has(event.type)) {
                trackMetrika(event.type, {
                    route: event.route || "",
                    format: event.formatSlug || "",
                    topic_slug: event.topicSlug || "",
                    topic: event.topic || "",
                    quiz_type: event.quizType || "",
                    session_length: event.sessionLength || "",
                    question_index: event.questionIndex ?? "",
                    question_id: event.questionId ?? "",
                    exit_reason: event.exitReason || "",
                    planned_questions: event.plannedQuestions ?? "",
                    answered_count: event.answeredCount ?? "",
                    score: event.score ?? "",
                    total: event.total ?? "",
                    percent: event.percent ?? ""
                });
            }
        }
    } catch {
        /* ignore */
    }

    try {
        const body = JSON.stringify({ source: "product-trainer", event });
        // fetch надёжнее sendBeacon на Vercel (body + JSON)
        fetch(EVENTS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true
        }).catch(() => {
            try {
                if (navigator.sendBeacon) {
                    const blob = new Blob([body], { type: "application/json" });
                    navigator.sendBeacon(EVENTS_API_URL, blob);
                }
            } catch {
                /* ignore */
            }
        });
    } catch {
        /* ignore network errors — локальный лог уже сохранён */
    }
}

/**
 * Агрегация по questionId: сколько раз верно / неверно.
 */
function getQuestionOutcomeStats() {
    const byId = new Map();

    for (const e of loadAnswerLog().events) {
        if (e.type !== "answer" || e.questionId == null) continue;
        const id = e.questionId;
        if (!byId.has(id)) {
            byId.set(id, { questionId: id, correct: 0, wrong: 0, topic: e.topic || null });
        }
        const row = byId.get(id);
        if (e.correct) row.correct++;
        else row.wrong++;
        if (e.topic) row.topic = e.topic;
    }

    return [...byId.values()].map((row) => {
        const attempts = row.correct + row.wrong;
        return {
            ...row,
            attempts,
            accuracy: attempts > 0 ? Math.round((row.correct / attempts) * 100) : null
        };
    });
}

/**
 * Самые сложные вопросы (мин. attempts, сортировка по доле ошибок).
 */
function getHardestQuestions(limit = 10, minAttempts = 2) {
    const qById = new Map(
        (typeof QUESTIONS !== "undefined" ? QUESTIONS : []).map((q) => [q.id, q])
    );

    const calcById = new Map(
        (typeof UNIT_CALC_SCENARIOS !== "undefined" ? UNIT_CALC_SCENARIOS : []).map((s) => [
            `unit-calc:${s.id}`,
            s
        ])
    );

    return getQuestionOutcomeStats()
        .filter((row) => row.attempts >= minAttempts && row.wrong > 0)
        .map((row) => {
            const labels =
                typeof resolveAnswerEventLabels === "function"
                    ? resolveAnswerEventLabels({ questionId: row.questionId, topic: row.topic })
                    : { questionText: "", selectedText: "", correctText: "" };
            const q = qById.get(row.questionId);
            const calc = calcById.get(String(row.questionId));

            return {
                ...row,
                question: labels.questionText || `Вопрос #${row.questionId}`,
                topic: row.topic || q?.topic || (calc ? "Юнит-экономика" : "—")
            };
        })
        .sort((a, b) => {
            const rateA = a.wrong / a.attempts;
            const rateB = b.wrong / b.attempts;
            if (rateB !== rateA) return rateB - rateA;
            return b.wrong - a.wrong;
        })
        .slice(0, limit);
}

function getAnswerLogSummary() {
    const events = loadAnswerLog().events.filter((e) => e.type === "answer");
    const correct = events.filter((e) => e.correct).length;
    const wrong = events.length - correct;
    return {
        totalAnswers: events.length,
        correct,
        wrong,
        uniqueQuestions: getQuestionOutcomeStats().length
    };
}

function renderHardestQuestionsHtml(limit = 10) {
    const summary = getAnswerLogSummary();
    const hardest = getHardestQuestions(limit, summary.totalAnswers >= 5 ? 2 : 1);

    if (summary.totalAnswers === 0) {
        return `
            <div class="answers-empty">
                <p>Пока нет данных по ответам. Пройдите квиз — здесь появятся самые сложные вопросы.</p>
            </div>
        `;
    }

    const practiceIds = hardest
        .map((row) => Number(row.questionId))
        .filter((id) => Number.isFinite(id) && id > 0);
    const practiceBtn =
        practiceIds.length > 0
            ? `<button type="button" class="btn btn-primary practice-cta" data-practice-ids='${JSON.stringify(practiceIds)}' data-practice-label="Сложные вопросы" data-practice-length="standard">Потренировать эти ${practiceIds.length}</button>`
            : "";

    const rows = hardest
        .map((row) => {
            const errRate = Math.round((row.wrong / row.attempts) * 100);
            return `
            <tr>
                <td class="answers-td-topic">${escapeHtml(row.topic)}</td>
                <td class="answers-td-q">
                    <span class="answers-qid">#${row.questionId}</span>
                    ${escapeHtml(row.question)}
                </td>
                <td class="answers-td-num">✓ ${row.correct}</td>
                <td class="answers-td-num answers-td-wrong">✗ ${row.wrong}</td>
                <td class="answers-td-num">${errRate}%</td>
            </tr>`;
        })
        .join("");

    return `
        <div class="answers-summary">
            <span>Всего ответов: <strong>${summary.totalAnswers}</strong></span>
            <span>✓ ${summary.correct}</span>
            <span>✗ ${summary.wrong}</span>
            <span>Уникальных вопросов: ${summary.uniqueQuestions}</span>
            ${practiceBtn}
        </div>
        ${
            hardest.length
                ? `<div class="answers-table-wrap">
                    <table class="answers-table">
                        <thead>
                            <tr>
                                <th>Тема</th>
                                <th>Вопрос</th>
                                <th>Верно</th>
                                <th>Ошибки</th>
                                <th>% ошибок</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <p class="answers-hint">Считается по истории ответов в этом браузере. При наличии сервера события также уходят на /api/events.</p>`
                : `<p class="answers-empty">Пока мало повторов — пройдите ещё несколько раундов, чтобы увидеть «сложные» вопросы.</p>`
        }
    `;
}
