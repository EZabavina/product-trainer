const STATS_KEY = "product-trainer-stats";
const MAX_SESSIONS = 1000;

function loadStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        return raw ? JSON.parse(raw) : { sessions: [] };
    } catch {
        return { sessions: [] };
    }
}

function saveStats(data) {
    if (data.sessions.length > MAX_SESSIONS) {
        data.sessions = data.sessions.slice(-MAX_SESSIONS);
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(data));
}

function recordSession(topic, score, total, mode = null, extras = {}) {
    const data = loadStats();
    data.sessions.push({
        id: Date.now(),
        topic,
        mode: mode || undefined,
        sessionLength: extras.sessionLength || undefined,
        quizType: extras.quizType || undefined,
        sessionId: extras.sessionId || undefined,
        score,
        total,
        percent: total > 0 ? Math.round((score / total) * 100) : 0,
        date: new Date().toISOString()
    });
    saveStats(data);
}

function getSessionTopicLabel(session) {
    if (session.quizType === "interview") {
        return "CustDev · Симулятор";
    }

    if (session.quizType === "mistakes") {
        const base = "Работа над ошибками";
        const len = getSessionLengthLabel(session.sessionLength);
        return len ? `${base} · ${len}` : base;
    }

    let label = session.topic;
    const cfg = getTopicConfig(session.topic);
    const mode = cfg.modes?.find((m) => m.id === session.mode);
    if (mode) label = `${label} · ${mode.label}`;

    const len = getSessionLengthLabel(session.sessionLength);
    if (len && session.sessionLength !== "standard") {
        label = `${label} · ${len}`;
    }

    return label;
}

function toDateKey(iso) {
    return iso.slice(0, 10);
}

function isToday(iso) {
    return toDateKey(iso) === toDateKey(new Date().toISOString());
}

function getOverview() {
    const sessions = loadStats().sessions;
    const today = sessions.filter((s) => isToday(s.date));
    const total = sessions.length;
    const avgPercent =
        total > 0
            ? Math.round(sessions.reduce((sum, s) => sum + s.percent, 0) / total)
            : 0;
    const bestPercent = total > 0 ? Math.max(...sessions.map((s) => s.percent)) : 0;
    const streak = getStreak(sessions);

    return {
        todayCount: today.length,
        todayAvg:
            today.length > 0
                ? Math.round(today.reduce((sum, s) => sum + s.percent, 0) / today.length)
                : null,
        total,
        avgPercent,
        bestPercent,
        streak
    };
}

function getStreak(sessions) {
    if (sessions.length === 0) return 0;

    const days = [...new Set(sessions.map((s) => toDateKey(s.date)))].sort().reverse();
    const today = toDateKey(new Date().toISOString());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday.toISOString());

    let streak = 0;
    let check = days.includes(today) ? today : yesterdayKey;

    for (const day of days) {
        if (day === check) {
            streak++;
            const d = new Date(check);
            d.setDate(d.getDate() - 1);
            check = d.toISOString().slice(0, 10);
        } else if (day < check) {
            break;
        }
    }
    return streak;
}

function getActivityDays(days = 14) {
    const sessions = loadStats().sessions;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const daySessions = sessions.filter((s) => toDateKey(s.date) === key);
        result.push({
            date: key,
            label: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
            count: daySessions.length,
            avg:
                daySessions.length > 0
                    ? Math.round(
                          daySessions.reduce((sum, s) => sum + s.percent, 0) / daySessions.length
                      )
                    : null
        });
    }
    return result;
}

function getTodayHourly() {
    const sessions = loadStats().sessions.filter((s) => isToday(s.date));
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));

    sessions.forEach((s) => {
        const h = new Date(s.date).getHours();
        hours[h].count++;
    });

    return hours.filter((h) => h.count > 0 || (h.hour >= 8 && h.hour <= 22));
}

function getTopicStats() {
    return getActiveTopics().map((topic) => {
        const sessions = loadStats().sessions.filter((s) => s.topic === topic.name);
        const count = sessions.length;
        const avg =
            count > 0
                ? Math.round(sessions.reduce((sum, s) => sum + s.percent, 0) / count)
                : null;
        const best = count > 0 ? Math.max(...sessions.map((s) => s.percent)) : null;
        const last = count > 0 ? sessions[sessions.length - 1] : null;

        return { ...topic, count, avg, best, last };
    });
}

function getRecentSessions(limit = 20) {
    return loadStats()
        .sessions.slice(-limit)
        .reverse();
}

function clearStats() {
    localStorage.removeItem(STATS_KEY);
    if (typeof clearAnswerLog === "function") clearAnswerLog();
    if (typeof clearInterviewHistory === "function") clearInterviewHistory();
}

function csvEscape(value) {
    const s = value == null ? "" : String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function downloadTextFile(filename, text, mime = "text/csv;charset=utf-8") {
    const blob = new Blob(["\uFEFF" + text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/** Экспорт прогресса: сессии + ответы в один CSV. */
function exportProgressCsv() {
    const sessions = loadStats().sessions || [];
    const events =
        typeof loadAnswerLog === "function" ? loadAnswerLog().events || [] : [];

    const rows = [
        [
            "kind",
            "date",
            "topic",
            "mode",
            "quizType",
            "sessionLength",
            "sessionId",
            "score",
            "total",
            "percent",
            "questionId",
            "correct",
            "selectedIndex"
        ].join(",")
    ];

    sessions.forEach((s) => {
        rows.push(
            [
                "session",
                s.date,
                s.topic,
                s.mode || "",
                s.quizType || "",
                s.sessionLength || "",
                s.sessionId || "",
                s.score,
                s.total,
                s.percent,
                "",
                "",
                ""
            ]
                .map(csvEscape)
                .join(",")
        );
    });

    events.forEach((e) => {
        // Сессии уже из loadStats — type:"session" из журнала ответов не дублируем
        if (e.type !== "answer") return;
        rows.push(
            [
                "answer",
                e.date,
                e.topic || "",
                e.mode || "",
                e.quizType || "",
                "",
                e.sessionId || "",
                "",
                "",
                "",
                e.questionId ?? "",
                e.correct === true ? "1" : e.correct === false ? "0" : "",
                e.selectedIndex ?? ""
            ]
                .map(csvEscape)
                .join(",")
        );
    });

    const stamp = new Date().toISOString().slice(0, 10);
    const answerCount = events.filter((e) => e.type === "answer").length;
    downloadTextFile(`product-trainer-progress-${stamp}.csv`, rows.join("\n"));
    return { sessions: sessions.length, events: answerCount };
}

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatDate(iso) {
    const d = new Date(iso);
    const today = new Date();
    if (toDateKey(iso) === toDateKey(today.toISOString())) return "Сегодня";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (toDateKey(iso) === toDateKey(yesterday.toISOString())) return "Вчера";
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
