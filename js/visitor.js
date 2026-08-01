/**
 * Идентификация посетителя для аналитики (Sheets / Metrika).
 *
 * - visitorId: стабильный UUID в localStorage (браузер)
 * - respondentCode: из ?uid= / ?respondent= / ?code= (персональная ссылка)
 * - cohort: из ?cohort= (группа теста)
 * - metrikaClientId: clientID Яндекс.Метрики (getClientID / cookie _ym_uid)
 *
 * uid/cohort хранятся в localStorage + cookie (~180 дней, sliding при активности).
 * Заход без ?uid= НЕ сбрасывает код. Сброс: ?uid= / ?respondent= (пусто|clear).
 * Пустой ?code= не сбрасывает. Смена uid без ?cohort= сбрасывает чужой cohort.
 *
 * Примеры:
 *   https://app.example/?uid=anna
 *   https://app.example/?uid=anna&cohort=pm-july
 */
const VISITOR_ID_KEY = "product-trainer-visitor-id";
const RESPONDENT_CODE_KEY = "product-trainer-respondent-code";
const COHORT_KEY = "product-trainer-cohort";
const METRIKA_CLIENT_ID_KEY = "product-trainer-metrika-client-id";
const RESPONDENT_COOKIE = "pt_uid";
const COHORT_COOKIE = "pt_cohort";
const IDENTITY_TOUCHED_KEY = "product-trainer-identity-touched";
/** ~6 месяцев; продлевается при активности */
const IDENTITY_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 180;

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

function isClearIdentityToken(value) {
    const v = String(value || "")
        .trim()
        .toLowerCase();
    return v === "" || v === "clear" || v === "reset" || v === "-";
}

function readCookie(name) {
    try {
        const match = document.cookie.match(
            new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
        );
        if (!match || match[1] == null) return "";
        return decodeURIComponent(match[1]);
    } catch {
        return "";
    }
}

function writeCookie(name, value, maxAgeSec = IDENTITY_COOKIE_MAX_AGE_SEC) {
    try {
        const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
    } catch {
        /* ignore */
    }
}

function clearCookie(name) {
    try {
        const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    } catch {
        /* ignore */
    }
}

function getOrCreateVisitorId() {
    try {
        const raw = localStorage.getItem(VISITOR_ID_KEY) || "";
        let id = sanitizeIdentityToken(raw, 80);
        if (id && id.length >= 8) {
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
        const fromLs = sanitizeIdentityToken(localStorage.getItem(RESPONDENT_CODE_KEY) || "");
        if (fromLs) {
            touchIdentityPersistence(fromLs, getStoredCohortRaw());
            return fromLs;
        }
    } catch {
        /* ignore */
    }
    const fromCookie = sanitizeIdentityToken(readCookie(RESPONDENT_COOKIE));
    if (fromCookie) {
        try {
            localStorage.setItem(RESPONDENT_CODE_KEY, fromCookie);
        } catch {
            /* ignore */
        }
        const cohort = getStoredCohortRaw();
        touchIdentityPersistence(fromCookie, cohort);
        return fromCookie;
    }
    return "";
}

/** Читает cohort без продления TTL (чтобы не зациклить touch). */
function getStoredCohortRaw() {
    try {
        const fromLs = sanitizeIdentityToken(localStorage.getItem(COHORT_KEY) || "", 40);
        if (fromLs) return fromLs;
    } catch {
        /* ignore */
    }
    return sanitizeIdentityToken(readCookie(COHORT_COOKIE), 40);
}

function getStoredCohort() {
    const cohort = getStoredCohortRaw();
    if (cohort) {
        try {
            localStorage.setItem(COHORT_KEY, cohort);
        } catch {
            /* ignore */
        }
        const uid = (() => {
            try {
                return sanitizeIdentityToken(localStorage.getItem(RESPONDENT_CODE_KEY) || "");
            } catch {
                return sanitizeIdentityToken(readCookie(RESPONDENT_COOKIE));
            }
        })();
        touchIdentityPersistence(uid, cohort);
    }
    return cohort;
}

function setStoredRespondentCode(code) {
    const clean = sanitizeIdentityToken(code);
    if (!clean) return;
    try {
        localStorage.setItem(RESPONDENT_CODE_KEY, clean);
    } catch {
        /* ignore */
    }
    writeCookie(RESPONDENT_COOKIE, clean);
    touchIdentityPersistence(clean, getStoredCohortRaw());
}

function setStoredCohort(cohort) {
    const clean = sanitizeIdentityToken(cohort, 40);
    if (!clean) return;
    try {
        localStorage.setItem(COHORT_KEY, clean);
    } catch {
        /* ignore */
    }
    writeCookie(COHORT_COOKIE, clean);
    touchIdentityPersistence(getStoredRespondentCodeNoTouch(), clean);
}

function getStoredRespondentCodeNoTouch() {
    try {
        const fromLs = sanitizeIdentityToken(localStorage.getItem(RESPONDENT_CODE_KEY) || "");
        if (fromLs) return fromLs;
    } catch {
        /* ignore */
    }
    return sanitizeIdentityToken(readCookie(RESPONDENT_COOKIE));
}

/** Продлевает cookie на 180 дней с последней активности. */
function touchIdentityPersistence(uid, cohort) {
    if (uid) writeCookie(RESPONDENT_COOKIE, uid);
    if (cohort) writeCookie(COHORT_COOKIE, cohort);
    try {
        localStorage.setItem(IDENTITY_TOUCHED_KEY, String(Date.now()));
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
    clearCookie(RESPONDENT_COOKIE);
}

function clearStoredCohort() {
    try {
        localStorage.removeItem(COHORT_KEY);
    } catch {
        /* ignore */
    }
    clearCookie(COHORT_COOKIE);
}

/**
 * Считать uid/cohort из URL (один раз за загрузку).
 * Без параметра — оставляем сохранённый код (TTL продлевается при чтении).
 * Сброс только через ?uid= / ?respondent= (пусто|clear), не через пустой ?code=
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
        const prevUid = getStoredRespondentCodeNoTouch();

        // uid / respondent — основные персональные ссылки (пустой = сброс)
        if (url.searchParams.has("uid")) {
            const raw = url.searchParams.get("uid");
            if (isClearIdentityToken(raw)) {
                clearStoredRespondentCode();
                clearStoredCohort();
            } else {
                const next = sanitizeIdentityToken(raw);
                if (prevUid && next && prevUid !== next && !url.searchParams.has("cohort")) {
                    // Новый человек по ссылке без cohort — не наследуем чужую группу
                    clearStoredCohort();
                }
                setStoredRespondentCode(raw);
            }
        } else if (url.searchParams.has("respondent")) {
            const raw = url.searchParams.get("respondent");
            if (isClearIdentityToken(raw)) {
                clearStoredRespondentCode();
                clearStoredCohort();
            } else {
                const next = sanitizeIdentityToken(raw);
                if (prevUid && next && prevUid !== next && !url.searchParams.has("cohort")) {
                    clearStoredCohort();
                }
                setStoredRespondentCode(raw);
            }
        } else if (url.searchParams.has("code")) {
            // ?code= — только установка; пустой code= не сбрасывает
            const raw = url.searchParams.get("code");
            const token = String(raw || "")
                .trim()
                .toLowerCase();
            if (token === "clear" || token === "reset" || token === "-") {
                clearStoredRespondentCode();
                clearStoredCohort();
            } else if (raw && !isClearIdentityToken(raw)) {
                const next = sanitizeIdentityToken(raw);
                if (prevUid && next && prevUid !== next && !url.searchParams.has("cohort")) {
                    clearStoredCohort();
                }
                setStoredRespondentCode(raw);
            }
        }

        if (url.searchParams.has("cohort")) {
            const raw = url.searchParams.get("cohort");
            if (isClearIdentityToken(raw)) clearStoredCohort();
            else setStoredCohort(raw);
        }

        // Продлить TTL при любом заходе, если код уже есть
        const uid = getStoredRespondentCodeNoTouch();
        const cohort = getStoredCohortRaw();
        if (uid || cohort) touchIdentityPersistence(uid, cohort);

        return {
            respondentCode: getStoredRespondentCodeNoTouch(),
            cohort: getStoredCohortRaw()
        };
    } catch {
        return {
            respondentCode: getStoredRespondentCodeNoTouch(),
            cohort: getStoredCohortRaw()
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
