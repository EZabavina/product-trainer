const MISTAKES_KEY = "product-trainer-mistakes";
const MAX_MISTAKES = 500;

function loadMistakeBank() {
    try {
        const raw = localStorage.getItem(MISTAKES_KEY);
        return raw ? JSON.parse(raw) : { items: {} };
    } catch {
        return { items: {} };
    }
}

function saveMistakeBank(data) {
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(data));
}

function getValidQuestionIds() {
    return new Set(QUESTIONS.map((q) => q.id));
}

function pruneStaleMistakes() {
    const validIds = getValidQuestionIds();
    const data = loadMistakeBank();
    let changed = false;

    for (const key of Object.keys(data.items)) {
        const id = data.items[key].id ?? Number(key);
        if (!validIds.has(id)) {
            delete data.items[key];
            changed = true;
        }
    }

    if (changed) saveMistakeBank(data);
    return changed;
}

function recordMistake(question) {
    if (!question?.id) return;

    const data = loadMistakeBank();
    const existing = data.items[question.id];
    data.items[question.id] = {
        id: question.id,
        topic: question.topic,
        mode: question.mode,
        date: new Date().toISOString(),
        count: (existing?.count || 0) + 1
    };

    const keys = Object.keys(data.items);
    if (keys.length > MAX_MISTAKES) {
        const sorted = keys.sort(
            (a, b) => new Date(data.items[b].date) - new Date(data.items[a].date)
        );
        const keep = new Set(sorted.slice(0, MAX_MISTAKES));
        data.items = Object.fromEntries(
            Object.entries(data.items).filter(([k]) => keep.has(k))
        );
    }

    saveMistakeBank(data);
}

function clearMistake(id) {
    const data = loadMistakeBank();
    delete data.items[id];
    saveMistakeBank(data);
}

function clearAllMistakes() {
    localStorage.removeItem(MISTAKES_KEY);
}

function getMistakeQuestions(topicFilter = null) {
    const validIds = getValidQuestionIds();
    const items = Object.values(loadMistakeBank().items).filter((item) =>
        validIds.has(item.id)
    );

    const filtered = items.filter(
        (item) => !topicFilter || topicFilter === "all" || item.topic === topicFilter
    );

    const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
    return filtered.map((item) => byId.get(item.id)).filter(Boolean);
}

function getMistakeCount(topicFilter = null) {
    return getMistakeQuestions(topicFilter).length;
}

function getTopicsWithMistakes() {
    return [...new Set(getMistakeQuestions().map((q) => q.topic))];
}
