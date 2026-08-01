/**
 * Приём аналитических событий (ответы / сессии).
 * Клиент → /api/events → EVENTS_WEBHOOK_URL (Google Apps Script → Sheets).
 *
 * Apps Script /exec отвечает 302 на usercontent URL; обычный fetch при follow
 * превращает POST в GET и doPost не выполняется. Поэтому редиректы
 * следуем вручную, сохраняя POST + text/plain.
 */
import { enrichAnswerTexts } from "./enrich-answer-texts.js";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method === "GET") {
        return res.status(200).json({
            ok: true,
            hasWebhook: Boolean(process.env.EVENTS_WEBHOOK_URL)
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        let body = req.body;
        if (typeof body === "string") {
            try {
                body = JSON.parse(body || "{}");
            } catch {
                body = {};
            }
        } else if (Buffer.isBuffer(body)) {
            try {
                body = JSON.parse(body.toString("utf8") || "{}");
            } catch {
                body = {};
            }
        }
        body = body || {};

        const event = body.event || body;
        if (!event || typeof event !== "object" || !event.type) {
            return res.status(400).json({ error: "event.type required" });
        }

        const allowed = new Set([
            "answer",
            "session",
            "session_start",
            "question_view",
            "session_exit",
            "session_complete"
        ]);
        if (!allowed.has(event.type)) {
            return res.status(400).json({ error: "unsupported event.type" });
        }

        const textOrNull = (value, max) => {
            if (value == null) return null;
            const s = String(value).trim();
            if (!s) return null;
            return s.slice(0, max);
        };

        let sanitized = {
            type: event.type,
            questionId: event.questionId ?? null,
            correct: event.type === "answer" ? Boolean(event.correct) : undefined,
            selectedIndex: event.selectedIndex ?? null,
            questionText: textOrNull(event.questionText, 500),
            selectedText: textOrNull(event.selectedText, 300),
            correctText: textOrNull(event.correctText, 300),
            topic: textOrNull(event.topic, 80),
            mode: textOrNull(event.mode, 40),
            quizType: textOrNull(event.quizType, 40),
            sessionId: textOrNull(event.sessionId, 64),
            sessionLength: textOrNull(event.sessionLength, 40),
            score: typeof event.score === "number" ? event.score : null,
            total: typeof event.total === "number" ? event.total : null,
            percent: typeof event.percent === "number" ? event.percent : null,
            route: textOrNull(event.route, 120),
            formatSlug: textOrNull(event.formatSlug, 40),
            topicSlug: textOrNull(event.topicSlug, 40),
            questionIndex: typeof event.questionIndex === "number" ? event.questionIndex : null,
            exitReason: textOrNull(event.exitReason, 40),
            plannedQuestions:
                typeof event.plannedQuestions === "number" ? event.plannedQuestions : null,
            answeredCount: typeof event.answeredCount === "number" ? event.answeredCount : null,
            date: event.date || new Date().toISOString(),
            receivedAt: new Date().toISOString()
        };

        // Страховка: восстановить тексты из банка вопросов, если клиент их не прислал
        sanitized = enrichAnswerTexts(sanitized);

        if (
            sanitized.type === "answer" &&
            (!sanitized.questionText || !sanitized.correctText)
        ) {
            console.warn("[events] answer still missing texts", {
                questionId: sanitized.questionId,
                hasQuestion: Boolean(sanitized.questionText),
                hasSelected: Boolean(sanitized.selectedText),
                hasCorrect: Boolean(sanitized.correctText)
            });
        }

        const webhook = process.env.EVENTS_WEBHOOK_URL;
        if (!webhook) {
            console.log(
                "[events]",
                sanitized.type,
                sanitized.questionId ?? sanitized.topic,
                sanitized.questionText ? `q:"${sanitized.questionText.slice(0, 40)}…"` : "q:(empty)"
            );
            return res.status(202).json({ ok: true, forwarded: false, hasWebhook: false });
        }

        const payload = JSON.stringify({ source: "product-trainer", event: sanitized });
        const upstream = await postToAppsScript(webhook, payload);

        if (!upstream.ok) {
            console.warn("EVENTS_WEBHOOK_URL failed:", upstream.status, upstream.snippet);
            return res.status(502).json({
                ok: false,
                forwarded: false,
                hasWebhook: true,
                upstreamStatus: upstream.status,
                upstreamSnippet: upstream.snippet
            });
        }

        return res.status(202).json({
            ok: true,
            forwarded: true,
            hasWebhook: true,
            upstreamStatus: upstream.status,
            // для отладки в Network: тексты реально ушли
            hasQuestionText: Boolean(sanitized.questionText),
            hasSelectedText: Boolean(sanitized.selectedText),
            hasCorrectText: Boolean(sanitized.correctText)
        });
    } catch (err) {
        console.error("Events API error:", err);
        return res.status(500).json({
            error: "Internal error",
            detail: String(err && err.message ? err.message : err).slice(0, 200)
        });
    }
}

/**
 * POST на Apps Script с ручным follow редиректов (сохраняем метод POST).
 */
async function postToAppsScript(url, payload, maxRedirects = 5) {
    let current = url;
    let lastStatus = 0;
    let snippet = "";

    for (let i = 0; i <= maxRedirects; i++) {
        const response = await fetch(current, {
            method: "POST",
            // text/plain — привычный обход для GAS; содержимое всё равно JSON-строка
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: payload,
            redirect: "manual"
        });

        lastStatus = response.status;
        const location = response.headers.get("location");

        if ([301, 302, 303, 307, 308].includes(response.status) && location) {
            current = new URL(location, current).toString();
            continue;
        }

        const text = await response.text().catch(() => "");
        snippet = String(text).replace(/\s+/g, " ").slice(0, 180);

        // GAS иногда отдаёт 200 с HTML-страницей авторизации
        if (response.status >= 400) {
            return { ok: false, status: response.status, snippet };
        }

        if (/Sign in|accounts\.google|Unauthorized|идентификац/i.test(snippet)) {
            return { ok: false, status: response.status || 401, snippet };
        }

        if (snippet && /"ok"\s*:\s*false/i.test(snippet)) {
            return { ok: false, status: response.status, snippet };
        }

        return { ok: true, status: response.status, snippet };
    }

    return { ok: false, status: lastStatus || 310, snippet: "too many redirects" };
}
