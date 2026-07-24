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

/**
 * Записать исход одного ответа.
 * @returns {object} event
 */
function recordAnswerOutcome(payload) {
    const event = {
        id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "answer",
        questionId: payload.questionId,
        correct: Boolean(payload.correct),
        selectedIndex:
            typeof payload.selectedIndex === "number" ? payload.selectedIndex : null,
        topic: payload.topic || null,
        mode: payload.mode || null,
        quizType: payload.quizType || "topic",
        sessionId: payload.sessionId || null,
        date: new Date().toISOString()
    };

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
            const q = qById.get(row.questionId);
            const calc = calcById.get(String(row.questionId));
            let question = q?.question || null;
            if (!question && calc) {
                question = `Расчёт: ${calc.title}`;
            }
            if (!question) question = `Вопрос #${row.questionId}`;

            return {
                ...row,
                question,
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
