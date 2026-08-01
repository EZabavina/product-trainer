/**
 * Идентификация посетителя для аналитики (Sheets / Metrika).
 *
 * - visitorId: стабильный UUID в localStorage (браузер)
 * - respondentCode: из ?uid= / ?respondent= / ?code= (персональная ссылка)
 * - cohort: из ?cohort= (группа теста)
 * - metrikaClientId: clientID Яндекс.Метрики (getClientID / cookie _ym_uid)
 *
 * Примеры ссылок:
 *   https://app.example/?uid=anna
 *   https://app.example/?uid=anna&cohort=pm-july
 *
 * Загрузка без uid/cohort сбрасывает прошлый respondent/cohort
 * (чтобы на общем браузере не наследовать чужой код). visitorId не трогаем.
 */
const VISITOR_ID_KEY = "product-trainer-visitor-id";
const RESPONDENT_CODE_KEY = "product-trainer-respondent-code";
const COHORT_KEY = "product-trainer-cohort";
const METRIKA_CLIENT_ID_KEY = "product-trainer-metrika-client-id";

let metrikaClientIdMemory = null;
let metrikaClientIdPollStarted = false;
/** URL-идентичность применяется один раз за загрузку страницы (до SPA-replaceState). */
let urlIdentityApplied = false;

function createVisitorUuid() {
    try {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
    } catch {
        /* ignore */
    }
    return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeIdentityToken(value, maxLen = 64) {
    if (value == null) return "";
    const cleaned = String(value)
        .trim()
        .slice(0, maxLen)
        .replace(/[^\w.@+=\-а-яА-ЯёЁ]/giu, "");
    return cleaned;
}

function getOrCreateVisitorId() {
    try {
        const raw = localStorage.getItem(VISITOR_ID_KEY) || "";
        let id = sanitizeIdentityToken(raw, 80);
        if (id && id.length >= 8) {
            // Перезаписать, если в storage лежал «грязный» id
            if (id !== raw) localStorage.setItem(VISITOR_ID_KEY, id);
            return id;
        }
        id = createVisitorUuid();
        localStorage.setItem(VISITOR_ID_KEY, id);
        return id;
    } catch {
        return createVisitorUuid();
    }
}

function getStoredRespondentCode() {
    try {
        return sanitizeIdentityToken(localStorage.getItem(RESPONDENT_CODE_KEY) || "");
    } catch {
        return "";
    }
}

function getStoredCohort() {
    try {
        return sanitizeIdentityToken(localStorage.getItem(COHORT_KEY) || "", 40);
    } catch {
        return "";
    }
}

function setStoredRespondentCode(code) {
    const clean = sanitizeIdentityToken(code);
    if (!clean) return;
    try {
        localStorage.setItem(RESPONDENT_CODE_KEY, clean);
    } catch {
        /* ignore */
    }
}

function setStoredCohort(cohort) {
    const clean = sanitizeIdentityToken(cohort, 40);
    if (!clean) return;
    try {
        localStorage.setItem(COHORT_KEY, clean);
    } catch {
        /* ignore */
    }
}

function clearStoredRespondentCode() {
    try {
        localStorage.removeItem(RESPONDENT_CODE_KEY);
    } catch {
        /* ignore */
    }
}

function clearStoredCohort() {
    try {
        localStorage.removeItem(COHORT_KEY);
    } catch {
        /* ignore */
    }
}

/**
 * Считать uid/cohort из URL.
 * По умолчанию один раз за загрузку: без параметров — сброс прошлых кодов.
 * @param {string} [href]
 * @param {{ force?: boolean }} [options] force — применить снова (тесты / редкие кейсы)
 */
function captureRespondentFromUrl(href = location.href, options = {}) {
    const force = Boolean(options && options.force);
    if (urlIdentityApplied && !force) {
        return {
            respondentCode: getStoredRespondentCode(),
            cohort: getStoredCohort()
        };
    }
    urlIdentityApplied = true;

    try {
        const url = new URL(href, location.origin);
        const hasUidParam =
            url.searchParams.has("uid") ||
            url.searchParams.has("respondent") ||
            url.searchParams.has("code");
        const hasCohortParam = url.searchParams.has("cohort");

        const uidRaw =
            url.searchParams.get("uid") ||
            url.searchParams.get("respondent") ||
            url.searchParams.get("code");
        const cohortRaw = url.searchParams.get("cohort");

        if (hasUidParam) {
            const clean = sanitizeIdentityToken(uidRaw);
            if (clean) setStoredRespondentCode(clean);
            else clearStoredRespondentCode();
        } else {
            clearStoredRespondentCode();
        }

        if (hasCohortParam) {
            const clean = sanitizeIdentityToken(cohortRaw, 40);
            if (clean) setStoredCohort(clean);
            else clearStoredCohort();
        } else {
            clearStoredCohort();
        }

        return {
            respondentCode: getStoredRespondentCode(),
            cohort: getStoredCohort()
        };
    } catch {
        return {
            respondentCode: getStoredRespondentCode(),
            cohort: getStoredCohort()
        };
    }
}

function readMetrikaClientIdFromCookie() {
    try {
        const match = document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]*)/);
        if (!match || !match[1]) return null;
        const clean = sanitizeIdentityToken(decodeURIComponent(match[1]), 64);
        return clean || null;
    } catch {
        return null;
    }
}

function getCachedMetrikaClientId() {
    if (metrikaClientIdMemory) return metrikaClientIdMemory;
    try {
        const stored = sanitizeIdentityToken(
            localStorage.getItem(METRIKA_CLIENT_ID_KEY) || "",
            64
        );
        if (stored) {
            metrikaClientIdMemory = stored;
            return stored;
        }
    } catch {
        /* ignore */
    }
    const fromCookie = readMetrikaClientIdFromCookie();
    if (fromCookie) {
        storeMetrikaClientId(fromCookie);
        return fromCookie;
    }
    return null;
}

function storeMetrikaClientId(clientId) {
    if (!clientId) return;
    const clean = sanitizeIdentityToken(clientId, 64);
    if (!clean) return;
    metrikaClientIdMemory = clean;
    try {
        localStorage.setItem(METRIKA_CLIENT_ID_KEY, clean);
    } catch {
        /* ignore */
    }
}

/**
 * Запросить / подтянуть clientID Метрики.
 * Не останавливаемся после первого ym() — ждём callback или cookie.
 */
function requestMetrikaClientId() {
    if (getCachedMetrikaClientId()) return;
    if (metrikaClientIdPollStarted) return;
    metrikaClientIdPollStarted = true;

    const counterId = typeof METRIKA_ID !== "undefined" ? METRIKA_ID : 110947031;

    const tick = () => {
        if (getCachedMetrikaClientId()) return true;

        const fromCookie = readMetrikaClientIdFromCookie();
        if (fromCookie) {
            storeMetrikaClientId(fromCookie);
            return true;
        }

        if (typeof ym === "function") {
            try {
                ym(counterId, "getClientID", (clientID) => {
                    if (clientID) storeMetrikaClientId(clientID);
                });
            } catch (err) {
                console.warn("Metrika getClientID failed:", err);
            }
        }
        return Boolean(getCachedMetrikaClientId());
    };

    if (tick()) return;

    let attempts = 0;
    const timer = setInterval(() => {
        attempts++;
        if (tick() || attempts >= 40) {
            clearInterval(timer);
        }
    }, 500);
}

/**
 * Контекст идентичности для событий аналитики.
 */
function getVisitorContext() {
    // Не перечитываем URL повторно — иначе после SPA-replaceState сбросили бы uid.
    if (!urlIdentityApplied) captureRespondentFromUrl();
    requestMetrikaClientId();

    return {
        visitorId: getOrCreateVisitorId(),
        respondentCode: getStoredRespondentCode() || null,
        cohort: getStoredCohort() || null,
        metrikaClientId: getCachedMetrikaClientId()
    };
}

function withVisitorContext(event) {
    const ctx = getVisitorContext();
    const visitorId =
        sanitizeIdentityToken(event.visitorId || ctx.visitorId, 80) || ctx.visitorId;
    const respondentCode =
        sanitizeIdentityToken(event.respondentCode || ctx.respondentCode || "", 64) ||
        null;
    const cohort =
        sanitizeIdentityToken(event.cohort || ctx.cohort || "", 40) || null;
    const metrikaClientId =
        sanitizeIdentityToken(event.metrikaClientId || ctx.metrikaClientId || "", 64) ||
        null;

    return {
        ...event,
        visitorId,
        respondentCode,
        cohort,
        metrikaClientId
    };
}
