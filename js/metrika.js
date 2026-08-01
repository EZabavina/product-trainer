/** Яндекс.Метрика — счётчик 110947031 */
const METRIKA_ID = 110947031;

/** UX-валидация (не системный сбой) → цель app_ux */
const METRIKA_UX_CATEGORIES = new Set([
    "unit_lab_empty",
    "unit_calc_empty",
    "quiz_empty"
]);

const METRIKA_ERROR_THROTTLE_MS = 8000;
const metrikaErrorThrottleMap = new Map();

function trackMetrika(goal, params) {
    try {
        if (typeof ym !== "function") return;
        // Третий аргумент — точный идентификатор цели в Метрике (JS-событие)
        if (params && typeof params === "object") {
            ym(METRIKA_ID, "reachGoal", goal, params);
        } else {
            ym(METRIKA_ID, "reachGoal", goal);
        }
    } catch (err) {
        console.warn("Metrika reachGoal failed:", goal, err);
    }
}

function trackMetrikaHit(url) {
    try {
        if (typeof ym !== "function") return;
        ym(METRIKA_ID, "hit", url || location.href, { title: document.title });
    } catch (err) {
        console.warn("Metrika hit failed:", err);
    }
}

function isMetrikaDebug() {
    try {
        if (typeof localStorage !== "undefined" && localStorage.getItem("pt_metrika_debug") === "1") {
            return true;
        }
        if (typeof location !== "undefined") {
            return new URLSearchParams(location.search).get("debug") === "1";
        }
    } catch {
        /* ignore */
    }
    return false;
}

function sanitizeMetrikaErrorParams(details = {}) {
    const out = {};
    const entries = Object.entries(details || {}).slice(0, 12);
    for (const [key, value] of entries) {
        if (key === "category" || key === "path") continue;
        const k = String(key).slice(0, 32);
        if (value == null || value === "") continue;
        if (typeof value === "number" && Number.isFinite(value)) {
            out[k] = value;
            continue;
        }
        if (typeof value === "boolean") {
            out[k] = value ? 1 : 0;
            continue;
        }
        out[k] = String(value).slice(0, 120);
    }
    return out;
}

function metrikaErrorThrottleKey(category, details = {}) {
    const parts = [
        category,
        details.message || "",
        details.task || "",
        details.challenge || "",
        details.scenario || "",
        details.type || "",
        details.source || "",
        details.phase || ""
    ];
    return parts.map((p) => String(p).slice(0, 80)).join("|");
}

function shouldSkipMetrikaError(category, details = {}) {
    const key = metrikaErrorThrottleKey(category, details);
    const now = Date.now();
    const prev = metrikaErrorThrottleMap.get(key) || 0;
    if (now - prev < METRIKA_ERROR_THROTTLE_MS) return true;
    metrikaErrorThrottleMap.set(key, now);
    // не раздуваем Map бесконечно
    if (metrikaErrorThrottleMap.size > 200) {
        const cutoff = now - METRIKA_ERROR_THROTTLE_MS;
        for (const [k, ts] of metrikaErrorThrottleMap) {
            if (ts < cutoff) metrikaErrorThrottleMap.delete(k);
        }
    }
    return false;
}

/**
 * Клиентские события ошибок/UX → Метрика.
 * Системные → цель app_error; UX (пустые ответы, пустой банк) → app_ux.
 * category: route_404 | interview_api | interview_save | unit_lab_empty |
 *           unit_calc_empty | quiz_empty | stats_render | analytics_send |
 *           js_error | unhandled_rejection | resource_error | …
 */
function trackMetrikaError(category, details = {}) {
    try {
        const cat = String(category || "unknown").slice(0, 40);
        if (shouldSkipMetrikaError(cat, details)) return;

        const isUx = METRIKA_UX_CATEGORIES.has(cat);
        const goal = isUx ? "app_ux" : "app_error";
        const path = String(
            details.path != null
                ? details.path
                : typeof location !== "undefined"
                  ? location.pathname
                  : ""
        ).slice(0, 120);

        const params = {
            category: cat,
            path,
            ...sanitizeMetrikaErrorParams(details)
        };

        if (typeof getVisitorContext === "function") {
            try {
                const ctx = getVisitorContext();
                if (ctx.visitorId) params.visitor_id = String(ctx.visitorId).slice(0, 64);
                if (ctx.respondentCode) params.respondent = String(ctx.respondentCode).slice(0, 40);
            } catch {
                /* ignore */
            }
        }

        trackMetrika(goal, params);

        if (typeof console !== "undefined" && console.warn) {
            if (!isUx || isMetrikaDebug()) {
                console.warn(`[${goal}]`, params.category, params);
            }
        }
    } catch (err) {
        console.warn("trackMetrikaError failed:", err);
    }
}

let metrikaErrorHandlersInstalled = false;

function installMetrikaErrorHandlers() {
    if (metrikaErrorHandlersInstalled || typeof window === "undefined") return;
    metrikaErrorHandlersInstalled = true;

    window.addEventListener(
        "error",
        (event) => {
            // Ошибки скриптов / ресурсов
            const isResource =
                event.target && event.target !== window && (event.target.src || event.target.href);
            if (isResource) {
                const tag = String(event.target.tagName || "").toLowerCase();
                if (tag !== "script" && tag !== "link") return;
                trackMetrikaError("resource_error", {
                    message: "resource_load_failed",
                    source: String(event.target.src || event.target.href || "").slice(0, 120),
                    tag
                });
                return;
            }
            trackMetrikaError("js_error", {
                message: event.message || "error",
                source: event.filename || "",
                line: event.lineno || 0,
                col: event.colno || 0
            });
        },
        true
    );

    window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        const message =
            reason && typeof reason === "object" && reason.message
                ? reason.message
                : String(reason || "rejection");
        trackMetrikaError("unhandled_rejection", { message });
    });
}

installMetrikaErrorHandlers();
