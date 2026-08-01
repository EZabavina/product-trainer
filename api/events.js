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

        /** Как sanitizeIdentityToken на клиенте: длина + безопасный алфавит. */
        const identityOrNull = (value, max) => {
            if (value == null) return null;
            const s = String(value)
                .trim()
                .slice(0, max)
                .replace(/[^\w.@+=\-а-яА-ЯёЁ]/giu, "");
            return s || null;
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
            visitorId: identityOrNull(event.visitorId, 80),
            respondentCode: identityOrNull(event.respondentCode, 64),
            cohort: identityOrNull(event.cohort, 40),
            metrikaClientId: identityOrNull(event.metrikaClientId, 64),
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
            hasQuestionText: Boolean(sanitized.questionText),
            hasSelectedText: Boolean(sanitized.selectedText),
            hasCorrectText: Boolean(sanitized.correctText),
            questionTextPreview: sanitized.questionText
                ? String(sanitized.questionText).slice(0, 80)
                : null,
            upstreamSnippet: upstream.snippet
                ? String(upstream.snippet).slice(0, 120)
                : null
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
 * POST на Apps Script.
 *
 * /exec отвечает 302 на googleusercontent echo-URL.
 * doPost УЖЕ выполнен на первом запросе; follow должен быть GET
 * (повторный POST на echo даёт 405 и ломает проверку успеха).
 */
async function postToAppsScript(url, payload, maxRedirects = 5) {
    let current = url;

    const response = await fetch(current, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload,
        redirect: "manual"
    });

    let lastStatus = response.status;
    let snippet = "";
    const location = response.headers.get("location");

    if ([301, 302, 303, 307, 308].includes(response.status) && location) {
        // Скрипт уже отработал — читаем тело ответа через GET
        let echoUrl = new URL(location, current).toString();
        for (let i = 0; i < maxRedirects; i++) {
            const echoRes = await fetch(echoUrl, {
                method: "GET",
                redirect: "manual"
            });
            lastStatus = echoRes.status;
            const nextLoc = echoRes.headers.get("location");
            if ([301, 302, 303, 307, 308].includes(echoRes.status) && nextLoc) {
                echoUrl = new URL(nextLoc, echoUrl).toString();
                continue;
            }
            const text = await echoRes.text().catch(() => "");
            snippet = String(text).replace(/\s+/g, " ").slice(0, 240);
            break;
        }
    } else {
        const text = await response.text().catch(() => "");
        snippet = String(text).replace(/\s+/g, " ").slice(0, 240);
    }

    if (lastStatus >= 400 && !snippet) {
        return { ok: false, status: lastStatus, snippet: "upstream error" };
    }

    if (/Sign in|accounts\.google|Unauthorized|идентификац/i.test(snippet)) {
        return { ok: false, status: lastStatus || 401, snippet };
    }

    if (snippet && /"ok"\s*:\s*false/i.test(snippet)) {
        return { ok: false, status: lastStatus, snippet };
    }

    // 302 без читаемого тела: doPost всё равно уже выполнен
    if (!snippet && [301, 302, 303].includes(response.status)) {
        return { ok: true, status: response.status, snippet: "accepted-via-redirect" };
    }

    if (lastStatus >= 400) {
        return { ok: false, status: lastStatus, snippet };
    }

    return { ok: true, status: lastStatus || response.status, snippet };
}
