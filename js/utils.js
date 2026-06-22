function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const SESSION_LENGTH_LABELS = {
    quick: "Быстрый",
    standard: "Стандарт",
    marathon: "Марафон"
};

function getSessionLengthLabel(lengthId) {
    return SESSION_LENGTH_LABELS[lengthId] || null;
}
