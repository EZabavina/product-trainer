/**
 * Приём аналитических событий (ответы / сессии).
 * Клиент пишет в localStorage; сервер проксирует в EVENTS_WEBHOOK_URL
 * (Google Apps Script → Sheets, см. scripts/sheets-webhook.gs).
 */
export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
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
        }
        body = body || {};

        const event = body.event || body;
        if (!event || typeof event !== "object" || !event.type) {
            return res.status(400).json({ error: "event.type required" });
        }

        const allowed = new Set(["answer", "session"]);
        if (!allowed.has(event.type)) {
            return res.status(400).json({ error: "unsupported event.type" });
        }

        const sanitized = {
            type: event.type,
            questionId: event.questionId ?? null,
            correct: event.type === "answer" ? Boolean(event.correct) : undefined,
            selectedIndex: event.selectedIndex ?? null,
            topic: typeof event.topic === "string" ? event.topic.slice(0, 80) : null,
            mode: typeof event.mode === "string" ? event.mode.slice(0, 40) : null,
            quizType: typeof event.quizType === "string" ? event.quizType.slice(0, 40) : null,
            sessionId: typeof event.sessionId === "string" ? event.sessionId.slice(0, 64) : null,
            sessionLength:
                typeof event.sessionLength === "string" ? event.sessionLength.slice(0, 40) : null,
            score: typeof event.score === "number" ? event.score : null,
            total: typeof event.total === "number" ? event.total : null,
            percent: typeof event.percent === "number" ? event.percent : null,
            date: event.date || new Date().toISOString(),
            receivedAt: new Date().toISOString()
        };

        const webhook = process.env.EVENTS_WEBHOOK_URL;
        if (webhook) {
            // Apps Script часто отвечает 302 → 200; follow + принимать 2xx/3xx
            const upstream = await fetch(webhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source: "product-trainer", event: sanitized }),
                redirect: "follow"
            });
            if (upstream.status >= 400) {
                console.warn("EVENTS_WEBHOOK_URL failed:", upstream.status);
                return res.status(502).json({ ok: false, forwarded: false });
            }
            return res.status(202).json({ ok: true, forwarded: true });
        }

        console.log("[events]", sanitized.type, sanitized.questionId ?? sanitized.topic);
        return res.status(202).json({ ok: true, forwarded: false });
    } catch (err) {
        console.error("Events API error:", err);
        return res.status(500).json({ error: "Internal error" });
    }
}
