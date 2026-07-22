/**
 * История разборов CustDev-интервью (localStorage).
 */
const INTERVIEW_HISTORY_KEY = "product-trainer-interviews";
const MAX_INTERVIEW_RECORDS = 40;

function loadInterviewHistory() {
    try {
        const raw = localStorage.getItem(INTERVIEW_HISTORY_KEY);
        return raw ? JSON.parse(raw) : { items: [] };
    } catch {
        return { items: [] };
    }
}

function saveInterviewHistory(data) {
    if (data.items.length > MAX_INTERVIEW_RECORDS) {
        data.items = data.items.slice(-MAX_INTERVIEW_RECORDS);
    }
    localStorage.setItem(INTERVIEW_HISTORY_KEY, JSON.stringify(data));
}

function clearInterviewHistory() {
    localStorage.removeItem(INTERVIEW_HISTORY_KEY);
}

function saveInterviewRecord(record) {
    const data = loadInterviewHistory();
    const item = {
        id: record.id || `iv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        scenarioId: record.scenarioId,
        scenarioTitle: record.scenarioTitle || "",
        respondentName: record.respondentName || "",
        messages: record.messages || [],
        debrief: record.debrief || "",
        userTurns: record.userTurns ?? (record.messages || []).filter((m) => m.role === "user").length,
        date: record.date || new Date().toISOString()
    };
    data.items.push(item);
    saveInterviewHistory(data);
    return item;
}

function getInterviewRecords(limit = 20) {
    const items = loadInterviewHistory().items || [];
    return [...items].reverse().slice(0, limit);
}

function getInterviewRecord(id) {
    return (loadInterviewHistory().items || []).find((i) => i.id === id) || null;
}

function renderInterviewHistoryHtml() {
    const items = getInterviewRecords(15);
    if (!items.length) {
        return `<p class="grade-empty">Пока нет сохранённых разборов. Завершите симулятор CustDev — разбор появится здесь.</p>`;
    }

    return `
        <div class="interview-history-list">
            ${items
                .map((item) => {
                    const when =
                        typeof formatDate === "function" ? formatDate(item.date) : item.date.slice(0, 10);
                    const time =
                        typeof formatTime === "function" ? formatTime(item.date) : "";
                    return `
                <button type="button" class="interview-history-item" data-interview-id="${escapeHtml(item.id)}">
                    <span class="interview-history-title">${escapeHtml(item.scenarioTitle || item.scenarioId)}</span>
                    <span class="interview-history-meta">${escapeHtml(when)}${time ? ` · ${escapeHtml(time)}` : ""} · ${item.userTurns} реплик</span>
                </button>`;
                })
                .join("")}
        </div>
    `;
}
