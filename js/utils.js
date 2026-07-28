function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const MOBILE_ACTION_SCREEN_IDS = [
    "quiz-screen",
    "unit-calc-screen",
    "unit-lab-screen",
    "results-screen",
    "interview-debrief-screen"
];

function getMobileActionScreen(actionEl) {
    if (!actionEl || typeof actionEl.closest !== "function") return null;
    return actionEl.closest(MOBILE_ACTION_SCREEN_IDS.map((id) => `#${id}`).join(", "));
}

/**
 * Keep primary CTA visible on short mobile viewports after content grows.
 * Toggles mobile-action-bar on the action row and has-mobile-actions on the screen
 * (CSS fallback without :has). Optionally scrolls feedback above the fixed bar.
 */
function ensurePrimaryActionVisible(actionEl, scrollTarget, options = {}) {
    if (!actionEl) return;

    const { scroll = true } = options;
    const hasVisibleBtn = Array.from(actionEl.querySelectorAll(".btn")).some(
        (btn) => !btn.classList.contains("hidden")
    );
    actionEl.classList.toggle("mobile-action-bar", hasVisibleBtn);

    const screen = getMobileActionScreen(actionEl);
    if (screen) {
        screen.classList.toggle("has-mobile-actions", hasVisibleBtn);
    }

    if (!scroll || !hasVisibleBtn) return;

    const target = scrollTarget || actionEl;
    requestAnimationFrame(() => {
        try {
            target.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest"
            });
        } catch {
            /* ignore */
        }
    });
}

function clearMobileActionBar(actionEl) {
    if (!actionEl) return;
    actionEl.classList.remove("mobile-action-bar");
    const screen = getMobileActionScreen(actionEl);
    if (screen) screen.classList.remove("has-mobile-actions");
}

const SESSION_LENGTH_LABELS = {
    quick: "Быстрый",
    standard: "Стандарт",
    marathon: "Марафон"
};

function getSessionLengthLabel(lengthId) {
    return SESSION_LENGTH_LABELS[lengthId] || null;
}
