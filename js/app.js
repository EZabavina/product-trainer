let currentTopic = null;
let currentTopicMode = null;
let currentSessionLength = "standard";
let currentQuizSessionId = null;
let currentQuizType = "topic";
let currentMistakeFilter = "all";
let currentPracticePoolIds = null;
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let currentSelectedIndex = null;
let wrongAnswers = [];
let resultsPercentCached = null;
let isApplyingRoute = false;
let currentAppUrl = `${location.pathname}${location.search}`;
let currentSessionEntryRoute = "/";
let activeQuizSessionMeta = null;
let sessionExitSent = false;

const QUIZ_SESSION_STORAGE_KEY = "pt_active_quiz_v1";

const trainView = document.getElementById("train-view");
const statsView = document.getElementById("stats-view");
const knowledgeView = document.getElementById("knowledge-view");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");
const topicsGrid = document.getElementById("topics-grid");
const overviewStrip = document.getElementById("overview-strip");
const quizTopicBadge = document.getElementById("quiz-topic-badge");
const quizProgress = document.getElementById("quiz-progress");
const progressFill = document.getElementById("progress-fill");
const questionText = document.getElementById("question-text");
const optionsList = document.getElementById("options-list");
const feedback = document.getElementById("feedback");
const feedbackIcon = document.getElementById("feedback-icon");
const feedbackTitle = document.getElementById("feedback-title");
const feedbackExplanation = document.getElementById("feedback-explanation");
const feedbackExample = document.getElementById("feedback-example");
const feedbackCheatsheet = document.getElementById("feedback-cheatsheet");
const feedbackActions = document.getElementById("feedback-actions");
const btnStudyTopic = document.getElementById("btn-study-topic");
const btnBack = document.getElementById("btn-back");
const btnNext = document.getElementById("btn-next");
const btnRestart = document.getElementById("btn-restart");
const btnHome = document.getElementById("btn-home");
const btnClearStats = document.getElementById("btn-clear-stats");
const btnExportCsv = document.getElementById("btn-export-csv");
const interviewHistorySection = document.getElementById("interview-history-section");
const resultsTopic = document.getElementById("results-topic");
const resultsScore = document.getElementById("results-score");
const resultsDetail = document.getElementById("results-detail");
const resultsRecommendation = document.getElementById("results-recommendation");
const resultsMistakes = document.getElementById("results-mistakes");
const resultsMistakesList = document.getElementById("results-mistakes-list");
const resultsKnowledge = document.getElementById("results-knowledge");
const resultsKnowledgeHint = document.getElementById("results-knowledge-hint");
const btnStudyAfterResults = document.getElementById("btn-study-after-results");
const ringFill = document.getElementById("ring-fill");
const statsHero = document.getElementById("stats-hero");
const activityChart = document.getElementById("activity-chart");
const hourlyChart = document.getElementById("hourly-chart");
const todaySection = document.getElementById("today-section");
const topicStatsGrid = document.getElementById("topic-stats-grid");
const sessionsList = document.getElementById("sessions-list");
const topicFilters = document.getElementById("topic-filters");
const knowledgeContent = document.getElementById("knowledge-content");
const gradesSection = document.getElementById("grades-section");
const hardestQuestionsSection = document.getElementById("hardest-questions");
const mainEl = document.querySelector(".main");
const btnBrand = document.getElementById("btn-brand");
const mistakesBanner = document.getElementById("mistakes-banner");
const quizSetup = document.getElementById("quiz-setup");
const quizSetupBackdrop = document.getElementById("quiz-setup-backdrop");
const quizSetupClose = document.getElementById("quiz-setup-close");
const quizSetupHeader = document.getElementById("quiz-setup-header");
const quizSetupSub = document.getElementById("quiz-setup-sub");
const setupFormatSection = document.getElementById("setup-format-section");
const setupFormatOptions = document.getElementById("setup-format-options");
const setupFilterSection = document.getElementById("setup-filter-section");
const setupFilterOptions = document.getElementById("setup-filter-options");
const setupLengthOptions = document.getElementById("setup-length-options");
const setupLengthSection = document.getElementById("setup-length-section");
const setupScenarioSection = document.getElementById("setup-scenario-section");
const setupScenarioOptions = document.getElementById("setup-scenario-options");
const setupStart = document.getElementById("setup-start");
const btnReviewMistakes = document.getElementById("btn-review-mistakes");

let knowledgeFilter = "all";
let pendingSetup = null;

const RING_CIRCUMFERENCE = 327;
const SESSION_LENGTHS = [
    { id: "quick", label: "Быстрый", count: 5, icon: "⚡", description: "5 вопросов" },
    { id: "standard", label: "Стандарт", count: 15, icon: "📋", description: "15 вопросов" },
    { id: "marathon", label: "Марафон", count: null, icon: "🏁", description: "Все из пула" }
];

const ROUTE_TOPIC_TO_NAME = {
    metrics: "Метрики",
    unit: "Юнит-экономика",
    fin: "Финансовая модель",
    jtbd: "JTBD",
    custdev: "CustDev"
};

const ROUTE_NAME_TO_TOPIC = Object.fromEntries(
    Object.entries(ROUTE_TOPIC_TO_NAME).map(([slug, name]) => [name, slug])
);

const ROUTE_FORMATS = {
    quiz: { topicSlugs: ["fin", "jtbd", "unit", "custdev"], modeByTopic: { unit: "quiz", custdev: "quiz" } },
    definitions: { topicSlugs: ["metrics"], modeByTopic: { metrics: "определение" } },
    cases: { topicSlugs: ["metrics"], modeByTopic: { metrics: "кейс" } },
    calc: { topicSlugs: ["unit"], modeByTopic: { unit: "calc" } },
    lab: { topicSlugs: ["unit"], modeByTopic: { unit: "lab" } },
    interview: { topicSlugs: ["custdev"], modeByTopic: { custdev: "interview" } }
};

const ROUTE_LENGTH_MAP = {
    "5": "quick",
    "15": "standard",
    "40": "marathon",
    quick: "quick",
    standard: "standard",
    marathon: "marathon"
};

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getQuestionCount(topicName, mode = null) {
    return QUESTIONS.filter((q) => {
        if (q.topic !== topicName) return false;
        if (mode) return q.mode === mode;
        return true;
    }).length;
}

function getSessionSize(poolSize, lengthId = "standard") {
    const cfg = SESSION_LENGTHS.find((l) => l.id === lengthId);
    if (!cfg || cfg.count === null) return poolSize;
    return Math.min(cfg.count, poolSize);
}

function getLengthRouteValue(lengthId = "standard") {
    if (lengthId === "quick") return "5";
    if (lengthId === "marathon") return "marathon";
    return "15";
}

function isLengthRouteFormat(formatSlug) {
    return ["quiz", "definitions", "cases"].includes(formatSlug);
}

function buildTrainPath({ format, topicSlug, length, q = null, done = false }) {
    const base = `/train/${format}/${topicSlug}/`;
    const params = new URLSearchParams();
    if (isLengthRouteFormat(format)) {
        params.set("length", getLengthRouteValue(length || "standard"));
    }
    if (done) {
        params.set("done", "1");
    } else if (q != null && Number(q) > 0) {
        params.set("q", String(Number(q)));
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

function getTopicNameFromRoute(topicSlug) {
    return ROUTE_TOPIC_TO_NAME[topicSlug] || null;
}

function getRouteLengthId(rawLength) {
    return ROUTE_LENGTH_MAP[String(rawLength || "").trim()] || "standard";
}

function getFormatForTopicMode(topicName, mode) {
    const topicSlug = ROUTE_NAME_TO_TOPIC[topicName];
    if (!topicSlug) return null;
    if (topicSlug === "metrics" && mode === "определение") return "definitions";
    if (topicSlug === "metrics" && mode === "кейс") return "cases";
    if (topicSlug === "unit" && mode === "calc") return "calc";
    if (topicSlug === "unit" && mode === "lab") return "lab";
    if (topicSlug === "custdev" && mode === "interview") return "interview";
    return "quiz";
}

function stripQuizProgressParams(urlString) {
    try {
        const url = new URL(urlString, location.origin);
        url.searchParams.delete("q");
        url.searchParams.delete("done");
        return `${url.pathname}${url.search}`;
    } catch {
        return urlString;
    }
}

function parseAppRoute(url = new URL(location.href)) {
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    if (pathname === "/") return { kind: "view", view: "train", canonicalUrl: "/" };
    if (pathname === "/knowledge") {
        return { kind: "view", view: "knowledge", canonicalUrl: "/knowledge" };
    }
    if (pathname === "/stats") return { kind: "view", view: "stats", canonicalUrl: "/stats" };

    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 3 && parts[0] === "train") {
        const [, format, topicSlug] = parts;
        const formatCfg = ROUTE_FORMATS[format];
        const topicName = getTopicNameFromRoute(topicSlug);
        if (!formatCfg || !topicName || !formatCfg.topicSlugs.includes(topicSlug)) return null;
        const mode = formatCfg.modeByTopic?.[topicSlug] || null;
        const length = getRouteLengthId(url.searchParams.get("length"));
        const done = url.searchParams.get("done") === "1";
        const rawQ = Number(url.searchParams.get("q"));
        const q = !done && Number.isFinite(rawQ) && rawQ > 0 ? Math.floor(rawQ) : null;
        return {
            kind: "train",
            format,
            topicSlug,
            topicName,
            mode,
            length,
            q,
            done,
            canonicalUrl: buildTrainPath({ format, topicSlug, length, q, done })
        };
    }

    return null;
}

function getCurrentUrl() {
    return `${location.pathname}${location.search}`;
}

function trackRouteView(url) {
    if (typeof trackMetrikaHit === "function") {
        trackMetrikaHit(url);
    }
}

function loadActiveQuizSession() {
    try {
        const raw = sessionStorage.getItem(QUIZ_SESSION_STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || data.version !== 1 || !Array.isArray(data.questionIds)) return null;
        return data;
    } catch {
        return null;
    }
}

function clearActiveQuizSession() {
    try {
        sessionStorage.removeItem(QUIZ_SESSION_STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

function canSyncQuizTrainUrl() {
    return currentQuizType === "topic" && Boolean(ROUTE_NAME_TO_TOPIC[currentTopic]);
}

function buildCurrentQuizTrainUrl({ q = null, done = false } = {}) {
    if (!canSyncQuizTrainUrl()) return null;
    const topicSlug = ROUTE_NAME_TO_TOPIC[currentTopic];
    const format = getFormatForTopicMode(currentTopic, currentTopicMode);
    if (!format || !ROUTE_FORMATS[format]?.topicSlugs.includes(topicSlug)) return null;
    return buildTrainPath({
        format,
        topicSlug,
        length: currentSessionLength || "standard",
        q,
        done
    });
}

function persistActiveQuizSession(extra = {}) {
    if (!quizQuestions.length) return;
    if (currentQuizType !== "topic" && currentQuizType !== "mistakes" && currentQuizType !== "practice") {
        return;
    }

    const phase =
        extra.phase ||
        (!resultsScreen.classList.contains("hidden") ? "results" : "quiz");

    const payload = {
        version: 1,
        sessionId: currentQuizSessionId,
        topic: currentTopic,
        mode: currentTopicMode,
        length: currentSessionLength,
        quizType: currentQuizType,
        mistakeFilter: currentMistakeFilter,
        practicePoolIds: currentPracticePoolIds,
        questionIds: quizQuestions.map((q) => q.id),
        currentIndex,
        score,
        answered,
        selectedIndex: answered ? currentSelectedIndex : null,
        wrongAnswers,
        phase,
        percent: phase === "results" ? resultsPercentCached : null,
        entryRoute: currentSessionEntryRoute || stripQuizProgressParams(getCurrentUrl()),
        format: getFormatForTopicMode(currentTopic, currentTopicMode),
        topicSlug: ROUTE_NAME_TO_TOPIC[currentTopic] || null,
        ...extra
    };

    try {
        sessionStorage.setItem(QUIZ_SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        /* ignore quota / private mode */
    }
}

function sessionMatchesRoute(session, route) {
    if (!session || !route || route.kind !== "train") return false;
    if (session.quizType !== "topic") return false;
    if (session.topic !== route.topicName) return false;
    if ((session.mode || null) !== (route.mode || null)) return false;
    if ((session.length || "standard") !== (route.length || "standard")) return false;
    if (session.format && session.format !== route.format) return false;
    if (session.topicSlug && session.topicSlug !== route.topicSlug) return false;
    return Array.isArray(session.questionIds) && session.questionIds.length > 0;
}

function rebuildQuizQuestionsFromIds(ids) {
    const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
    const restored = ids.map((id) => byId.get(id)).filter(Boolean);
    return restored.length === ids.length ? restored : null;
}

function syncActiveQuizUrl({ replace = true, track = true, force = false } = {}) {
    if (isApplyingRoute && !force) return;
    if (!canSyncQuizTrainUrl()) return;

    const done = !resultsScreen.classList.contains("hidden");
    const q = done ? null : currentIndex + 1;
    const nextUrl = buildCurrentQuizTrainUrl({ q, done });
    if (!nextUrl || nextUrl === getCurrentUrl()) {
        currentAppUrl = getCurrentUrl();
        return;
    }

    if (replace) history.replaceState({}, "", nextUrl);
    else history.pushState({}, "", nextUrl);
    currentAppUrl = getCurrentUrl();
    if (track) trackRouteView(currentAppUrl);
}

function enterActiveSession() {
    const stripped = stripQuizProgressParams(getCurrentUrl());
    if (stripped.startsWith("/train/")) {
        currentSessionEntryRoute = stripped;
        return;
    }

    const built = currentTopic
        ? buildTopicSetupUrl(currentTopic, currentTopicMode, currentSessionLength || "standard")
        : "/";
    if (built.startsWith("/train/")) {
        currentSessionEntryRoute = built;
    } else if (!currentSessionEntryRoute || currentSessionEntryRoute === "/") {
        currentSessionEntryRoute = stripped || "/";
    }
}

function buildSessionLifecyclePayload(extra = {}) {
    let formatSlug = null;
    let topicSlug = null;
    const parsed = parseAppRoute(new URL(`${location.origin}${currentSessionEntryRoute || "/"}`));
    if (parsed?.kind === "train") {
        formatSlug = parsed.format;
        topicSlug = parsed.topicSlug;
    }

    return {
        route: currentSessionEntryRoute || "/",
        formatSlug,
        topicSlug,
        topic: currentTopic,
        mode: currentTopicMode,
        quizType: currentQuizType,
        sessionLength: currentSessionLength,
        sessionId: currentQuizSessionId,
        ...extra
    };
}

function beginQuizSession(extra = {}) {
    enterActiveSession();
    activeQuizSessionMeta = buildSessionLifecyclePayload(extra);
    sessionExitSent = false;
    if (!extra.restored && typeof recordLifecycleEvent === "function") {
        recordLifecycleEvent({ type: "session_start", ...activeQuizSessionMeta });
    }
}

function trackQuestionView() {
    if (!activeQuizSessionMeta || typeof recordLifecycleEvent !== "function") return;
    const q = quizQuestions[currentIndex];
    if (!q) return;
    recordLifecycleEvent({
        type: "question_view",
        ...activeQuizSessionMeta,
        questionIndex: currentIndex + 1,
        questionId: q.id,
        plannedQuestions: quizQuestions.length
    });
}

function trackSessionExit(exitReason, { clearStorage = true } = {}) {
    if (!activeQuizSessionMeta || sessionExitSent) return;
    if (quizScreen.classList.contains("hidden")) return;

    sessionExitSent = true;
    const q = quizQuestions[currentIndex];
    const answeredCount = currentIndex + (answered ? 1 : 0);
    if (typeof recordLifecycleEvent === "function") {
        recordLifecycleEvent({
            type: "session_exit",
            ...activeQuizSessionMeta,
            questionIndex: currentIndex + 1,
            questionId: q?.id ?? null,
            answeredCount,
            plannedQuestions: quizQuestions.length,
            exitReason
        });
    }
    activeQuizSessionMeta = null;
    currentSessionEntryRoute = "/";
    if (clearStorage) {
        clearActiveQuizSession();
    }
}

function trackSessionComplete(score, total, percent) {
    if (!activeQuizSessionMeta || typeof recordLifecycleEvent !== "function") return;
    sessionExitSent = true;
    recordLifecycleEvent({
        type: "session_complete",
        ...activeQuizSessionMeta,
        score,
        total,
        percent,
        plannedQuestions: total,
        answeredCount: total
    });
    activeQuizSessionMeta = null;
}

function canLeaveCurrentFlow(exitReason = "leave_confirm") {
    const inActiveQuiz = !quizScreen.classList.contains("hidden");
    const inResults = !resultsScreen.classList.contains("hidden");

    if (inActiveQuiz && (answered || currentIndex > 0)) {
        if (!confirm("Выйти из квиза? Прогресс этой попытки будет сброшен.")) {
            return false;
        }
    }
    if (inActiveQuiz) {
        trackSessionExit(exitReason);
    } else if (inResults) {
        clearActiveQuizSession();
        currentSessionEntryRoute = "/";
    }

    if (typeof isInterviewActive === "function" && isInterviewActive() && !confirmLeaveInterview()) {
        return false;
    }

    if (typeof isUnitCalcActive === "function" && isUnitCalcActive() && !confirmLeaveUnitCalc()) {
        return false;
    }

    if (typeof isUnitLabActive === "function" && isUnitLabActive() && !confirmLeaveUnitLab()) {
        return false;
    }

    return true;
}

function navigateToUrl(nextUrl, { replace = false, exitReason = "nav_click" } = {}) {
    if (nextUrl === currentAppUrl) return;
    if (!canLeaveCurrentFlow(exitReason)) return;

    if (replace) history.replaceState({}, "", nextUrl);
    else history.pushState({}, "", nextUrl);
    applyCurrentRoute({ replace });
}

function syncUrlForMainView(view, { replace = false } = {}) {
    const map = {
        train: "/",
        knowledge: "/knowledge",
        stats: "/stats"
    };
    const url = map[view];
    if (!url || isApplyingRoute || getCurrentUrl() === url) return;
    if (replace) history.replaceState({}, "", url);
    else history.pushState({}, "", url);
    currentAppUrl = getCurrentUrl();
    trackRouteView(currentAppUrl);
}

function getModeLabel(topicName, modeId) {
    const cfg = getTopicConfig(topicName);
    const mode = cfg.modes?.find((m) => m.id === modeId);
    return mode ? mode.label : modeId;
}

function getModeConfig(topicName, modeId) {
    return getTopicConfig(topicName).modes?.find((m) => m.id === modeId);
}

function isInterviewMode(topicName, modeId) {
    return getModeConfig(topicName, modeId)?.type === "interview";
}

function isCalcMode(topicName, modeId) {
    return getModeConfig(topicName, modeId)?.type === "calc";
}

function isLabMode(topicName, modeId) {
    return getModeConfig(topicName, modeId)?.type === "lab";
}

function isQuizModeAll(topicName, modeId) {
    const mode = getModeConfig(topicName, modeId);
    return mode?.type === "quiz";
}

function getTopicCountText(topicName) {
    const cfg = getTopicConfig(topicName);
    if (cfg.modes?.length) {
        return cfg.modes
            .map((m) => {
                if (m.type === "interview") {
                    return `${getInterviewScenarioCount()} сценариев`;
                }
                if (m.type === "lab") {
                    return `${typeof getUnitLabChallengeCount === "function" ? getUnitLabChallengeCount() : 6} челленджей`;
                }
                if (m.type === "calc") {
                    return `${getUnitCalcScenarioCount()} расчётов`;
                }
                if (m.type === "quiz") {
                    return `${getQuestionCount(topicName)} вопросов`;
                }
                return `${getQuestionCount(topicName, m.id)} ${m.label.toLowerCase()}`;
            })
            .join(" · ");
    }
    return `${getQuestionCount(topicName)} в базе`;
}

function getModeCountLabel(topicName, mode) {
    if (mode.type === "interview") {
        return `${getInterviewScenarioCount()} сценариев`;
    }
    if (mode.type === "lab") {
        const n = typeof getUnitLabChallengeCount === "function" ? getUnitLabChallengeCount() : 6;
        return `${n} челленджей · живая модель`;
    }
    if (mode.type === "calc") {
        return `${getUnitCalcScenarioCount()} заданий`;
    }
    if (mode.type === "quiz") {
        return `${getQuestionCount(topicName)} вопросов в базе`;
    }
    return `${getQuestionCount(topicName, mode.id)} вопросов в базе`;
}

function renderMistakesBanner() {
    const count = getMistakeCount();
    if (count === 0) {
        mistakesBanner.classList.add("hidden");
        mistakesBanner.innerHTML = "";
        return;
    }

    mistakesBanner.classList.remove("hidden");
    mistakesBanner.innerHTML = `
        <div class="mistakes-banner-body">
            <h3>🔄 Работа над ошибками</h3>
            <p>${count} ${pluralQuestions(count)} на повторение — ответили верно, и вопрос уберётся из списка</p>
        </div>
        <div class="mistakes-banner-actions">
            <button type="button" class="btn btn-primary" id="btn-start-mistakes">Повторить</button>
            <button type="button" class="btn-text" id="btn-clear-mistakes">Очистить</button>
        </div>
    `;

    document.getElementById("btn-start-mistakes").addEventListener("click", openQuizSetupForMistakes);
    document.getElementById("btn-clear-mistakes").addEventListener("click", () => {
        if (confirm(`Удалить все ${count} вопросов из банка ошибок?`)) {
            clearAllMistakes();
            renderMistakesBanner();
            renderTopics();
        }
    });
}

function pluralQuestions(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "вопрос";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "вопроса";
    return "вопросов";
}

function scoreClass(percent) {
    if (percent >= 80) return "good";
    if (percent >= 50) return "mid";
    return "bad";
}

function renderOverviewStrip() {
    const o = getOverview();
    overviewStrip.innerHTML = `
        <div class="stat-pill">
            <div class="stat-pill-value">${o.todayCount}</div>
            <div class="stat-pill-label">Сегодня</div>
        </div>
        <div class="stat-pill">
            <div class="stat-pill-value">${o.total}</div>
            <div class="stat-pill-label">Всего</div>
        </div>
        <div class="stat-pill">
            <div class="stat-pill-value">${o.total > 0 ? o.avgPercent + "%" : "—"}</div>
            <div class="stat-pill-label">Средний %</div>
        </div>
        <div class="stat-pill">
            <div class="stat-pill-value">${o.streak}</div>
            <div class="stat-pill-label">Дней подряд</div>
        </div>
    `;
}

function renderTopics() {
    const topicStats = getTopicStats();

    topicsGrid.innerHTML = topicStats
        .map((topic) => {
            const cfg = getTopicConfig(topic.name);
            const hasModes = Boolean(cfg.modes?.length);
            const countText = getTopicCountText(topic.name);
            const miniStat =
                topic.count > 0
                    ? `Ср. ${topic.avg}% · ${topic.count} раз`
                    : "Ещё не проходили";
            const miniClass = topic.count > 0 ? "topic-mini-stat" : "topic-mini-stat empty";

            return `
            <div class="topic-card${hasModes ? " has-modes" : ""}" data-topic="${escapeHtml(topic.name)}" style="--topic-color: ${topic.color}">
                <div class="topic-card-header">
                    <span class="topic-icon">${topic.icon}</span>
                    <h3>${escapeHtml(topic.name)}</h3>
                </div>
                <p class="topic-desc">${escapeHtml(topic.description)}</p>
                <div class="topic-footer">
                    <span class="topic-count">${countText}</span>
                    <span class="${miniClass}">${escapeHtml(miniStat)}</span>
                </div>
            </div>
        `;
        })
        .join("");

    topicsGrid.querySelectorAll(".topic-card").forEach((card) => {
        card.addEventListener("click", () => openQuizSetupForTopic(card.dataset.topic));
    });

    renderMistakesBanner();
}

function syncSetupRoute({ replace = true } = {}) {
    if (isApplyingRoute || !pendingSetup || pendingSetup.kind !== "topic") return;
    if (!quizScreen.classList.contains("hidden") || !resultsScreen.classList.contains("hidden")) {
        return;
    }

    const nextUrl = buildTopicSetupUrl(
        pendingSetup.topic,
        pendingSetup.mode,
        pendingSetup.length || "standard"
    );
    if (nextUrl === getCurrentUrl()) return;

    if (replace) history.replaceState({}, "", nextUrl);
    else history.pushState({}, "", nextUrl);
    currentAppUrl = getCurrentUrl();
    trackRouteView(currentAppUrl);
}

function openQuizSetupForTopic(topic) {
    const cfg = getTopicConfig(topic);
    pendingSetup = {
        kind: "topic",
        topic,
        mode: cfg.modes?.[0]?.id || null,
        length: "standard"
    };
    renderQuizSetup();
}

function openQuizSetupForMistakes() {
    pendingSetup = { kind: "mistakes", filter: "all", length: "standard" };
    renderQuizSetup();
}

function openTopicSetupFromRoute(route) {
    showMainView("train", { syncRoute: false });
    pendingSetup = {
        kind: "topic",
        topic: route.topicName,
        mode: route.mode,
        length: route.length
    };
    if (isInterviewMode(route.topicName, route.mode)) {
        pendingSetup.scenarioId = null;
    }

    const setupUrl = buildTrainPath({
        format: route.format,
        topicSlug: route.topicSlug,
        length: route.length
    });
    if (setupUrl !== getCurrentUrl()) {
        history.replaceState({}, "", setupUrl);
        currentAppUrl = setupUrl;
    }

    renderQuizSetup();
}

function startFreshQuizFromRoute(route) {
    pendingSetup = {
        kind: "topic",
        topic: route.topicName,
        mode: route.mode,
        length: route.length
    };
    const pool = getSetupPool();
    pendingSetup = null;
    if (!pool.length) {
        openTopicSetupFromRoute(route);
        alert("В этом формате пока нет вопросов.");
        return;
    }
    launchQuiz({
        pool,
        topic: route.topicName,
        mode: route.mode,
        length: route.length,
        quizType: "topic"
    });
}

function resumeQuizSession(session) {
    const restoredQuestions = rebuildQuizQuestionsFromIds(session.questionIds);
    if (!restoredQuestions) {
        clearActiveQuizSession();
        return false;
    }

    currentTopic = session.topic;
    currentTopicMode = session.mode;
    currentSessionLength = session.length || "standard";
    currentQuizType = session.quizType || "topic";
    currentMistakeFilter = session.mistakeFilter || "all";
    currentPracticePoolIds = session.practicePoolIds || null;
    quizQuestions = restoredQuestions;
    currentIndex = Math.min(
        Math.max(0, Number(session.currentIndex) || 0),
        Math.max(0, quizQuestions.length - 1)
    );
    score = Number(session.score) || 0;
    answered = Boolean(session.answered);
    currentSelectedIndex =
        answered && Number.isFinite(session.selectedIndex) ? Number(session.selectedIndex) : null;
    wrongAnswers = Array.isArray(session.wrongAnswers) ? session.wrongAnswers : [];
    currentQuizSessionId = session.sessionId || createQuizSessionId();
    currentSessionEntryRoute =
        session.entryRoute ||
        stripQuizProgressParams(getCurrentUrl()) ||
        "/";
    resultsPercentCached =
        session.percent != null
            ? session.percent
            : Math.round((score / Math.max(quizQuestions.length, 1)) * 100);

    beginQuizSession({
        plannedQuestions: quizQuestions.length,
        restored: true
    });

    trainView.classList.add("hidden");
    statsView.classList.add("hidden");
    knowledgeView.classList.add("hidden");
    setNavVisible(false);
    closeQuizSetup({ resetRoute: false });

    if (session.phase === "results") {
        quizScreen.classList.add("hidden");
        resultsScreen.classList.remove("hidden");
        paintResultsScreen(resultsPercentCached, quizQuestions.length, { skipRecord: true });
        syncActiveQuizUrl({ track: false, force: true });
        persistActiveQuizSession({ phase: "results", percent: resultsPercentCached });
        return true;
    }

    resultsScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    updateQuizBadge();
    renderQuestion({
        restoreSelectedIndex: answered ? currentSelectedIndex : null,
        skipLifecycleView: true
    });
    syncActiveQuizUrl({ track: false, force: true });
    persistActiveQuizSession({ phase: "quiz" });
    return true;
}

function applyTrainRoute(route) {
    if (isLabMode(route.topicName, route.mode)) {
        showMainView("train", { syncRoute: false });
        startUnitLab();
        return;
    }

    if (isCalcMode(route.topicName, route.mode)) {
        showMainView("train", { syncRoute: false });
        startUnitCalc(route.length);
        return;
    }

    if (isInterviewMode(route.topicName, route.mode) && !route.q && !route.done) {
        openTopicSetupFromRoute(route);
        return;
    }

    const session = loadActiveQuizSession();

    if (route.done) {
        if (sessionMatchesRoute(session, route) && session.phase === "results") {
            resumeQuizSession(session);
            return;
        }
        clearActiveQuizSession();
        openTopicSetupFromRoute(route);
        return;
    }

    if (route.q) {
        if (sessionMatchesRoute(session, route)) {
            resumeQuizSession(session);
            return;
        }
        clearActiveQuizSession();
        startFreshQuizFromRoute(route);
        return;
    }

    if (sessionMatchesRoute(session, route) && session.phase === "quiz") {
        if (confirm("Продолжить незавершённый квиз с того места, где остановились?")) {
            resumeQuizSession(session);
            return;
        }
        clearActiveQuizSession();
    } else if (sessionMatchesRoute(session, route) && session.phase === "results") {
        if (confirm("Показать результаты последней попытки?")) {
            resumeQuizSession(session);
            return;
        }
        clearActiveQuizSession();
    }

    openTopicSetupFromRoute(route);
}

function applyCurrentRoute({ replace = false } = {}) {
    const route = parseAppRoute(new URL(location.href));
    if (!route) {
        history.replaceState({}, "", "/");
        currentAppUrl = "/";
        trackRouteView(currentAppUrl);
        showMainView("train", { syncRoute: false });
        return;
    }

    isApplyingRoute = true;
    try {
        if (route.canonicalUrl !== getCurrentUrl()) {
            history.replaceState({}, "", route.canonicalUrl);
        }

        if (route.kind === "view") {
            showMainView(route.view, { syncRoute: false });
        } else if (route.kind === "train") {
            applyTrainRoute(route);
        }

        currentAppUrl = getCurrentUrl();
        trackRouteView(currentAppUrl);
    } finally {
        isApplyingRoute = false;
    }
}

let setupBodyScrollY = 0;
const QUIZ_SETUP_OPEN_CLASS = "quiz-setup-open";

function lockBodyForQuizSetup() {
    if (document.documentElement.classList.contains(QUIZ_SETUP_OPEN_CLASS)) return;
    setupBodyScrollY = window.scrollY || 0;
    document.documentElement.classList.add(QUIZ_SETUP_OPEN_CLASS);
    document.body.classList.add(QUIZ_SETUP_OPEN_CLASS);
    document.body.style.top = `-${setupBodyScrollY}px`;
}

function unlockBodyForQuizSetup() {
    if (!document.documentElement.classList.contains(QUIZ_SETUP_OPEN_CLASS)) return;
    document.documentElement.classList.remove(QUIZ_SETUP_OPEN_CLASS);
    document.body.classList.remove(QUIZ_SETUP_OPEN_CLASS);
    document.body.style.top = "";
    window.scrollTo(0, setupBodyScrollY);
}

function renderQuizSetup() {
    if (!pendingSetup) return;

    const setupColor = "#EF4444";

    if (pendingSetup.kind === "topic") {
        const cfg = getTopicConfig(pendingSetup.topic);
        quizSetupHeader.innerHTML = `
            <span class="topic-icon">${cfg.icon}</span>
            <h2 id="quiz-setup-title">${escapeHtml(pendingSetup.topic)}</h2>
        `;
        quizSetupSub.textContent = "Выберите формат и длину раунда";
        setupFormatSection.classList.toggle("hidden", !cfg.modes?.length);

        if (cfg.modes?.length) {
            setupFormatOptions.innerHTML = cfg.modes
                .map((mode) => {
                    const countLabel = getModeCountLabel(pendingSetup.topic, mode);
                    return `
                    <button type="button" class="mode-option-btn${pendingSetup.mode === mode.id ? " active" : ""}" data-mode="${escapeHtml(mode.id)}" style="--mode-color: ${cfg.color}">
                        <span class="mode-option-icon">${mode.icon}</span>
                        <div class="mode-option-body">
                            <h3>${escapeHtml(mode.label)}</h3>
                            <p>${escapeHtml(mode.description)}</p>
                            <span class="mode-option-count">${countLabel}</span>
                        </div>
                    </button>
                `;
                })
                .join("");

            setupFormatOptions.querySelectorAll(".mode-option-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    pendingSetup.mode = btn.dataset.mode;
                    if (!isInterviewMode(pendingSetup.topic, pendingSetup.mode)) {
                        pendingSetup.scenarioId = null;
                    }
                    renderQuizSetup();
                });
            });
        }

        renderLengthOptions(cfg.color);
        renderScenarioOptions(cfg.color);
    } else {
        quizSetupHeader.innerHTML = `
            <span class="topic-icon">🔄</span>
            <h2 id="quiz-setup-title">Работа над ошибками</h2>
        `;
        quizSetupSub.textContent = "Повторите вопросы, в которых ошибались";
        setupFormatSection.classList.add("hidden");

        const topics = getTopicsWithMistakes();
        setupFilterSection.classList.remove("hidden");
        setupFilterOptions.innerHTML = `
            <button type="button" class="setup-chip${pendingSetup.filter === "all" ? " active" : ""}" data-filter="all" style="--chip-color: ${setupColor}">Все темы (${getMistakeCount()})</button>
            ${topics
                .map((topic) => {
                    const cfg = getTopicConfig(topic);
                    const count = getMistakeCount(topic);
                    return `
                <button type="button" class="setup-chip${pendingSetup.filter === topic ? " active" : ""}" data-filter="${escapeHtml(topic)}" style="--chip-color: ${cfg.color}">
                    ${cfg.icon} ${escapeHtml(topic)} (${count})
                </button>
            `;
                })
                .join("")}
        `;

        setupFilterOptions.querySelectorAll(".setup-chip").forEach((chip) => {
            chip.addEventListener("click", () => {
                pendingSetup.filter = chip.dataset.filter;
                renderQuizSetup();
            });
        });

        renderLengthOptions(setupColor);
    }

    setupFilterSection.classList.toggle("hidden", pendingSetup.kind !== "mistakes");

    const isInterview =
        pendingSetup.kind === "topic" &&
        isInterviewMode(pendingSetup.topic, pendingSetup.mode);
    const isCalc =
        pendingSetup.kind === "topic" && isCalcMode(pendingSetup.topic, pendingSetup.mode);
    const isLab =
        pendingSetup.kind === "topic" && isLabMode(pendingSetup.topic, pendingSetup.mode);

    setupLengthSection.classList.toggle("hidden", isInterview || isLab);
    setupScenarioSection.classList.toggle("hidden", !isInterview);

    if (isInterview) {
        setupStart.disabled = !pendingSetup.scenarioId;
        setupStart.textContent = pendingSetup.scenarioId
            ? "Начать интервью"
            : "Выберите сценарий";
    } else if (isLab) {
        const n = typeof getUnitLabChallengeCount === "function" ? getUnitLabChallengeCount() : 6;
        setupStart.disabled = false;
        setupStart.textContent = `Открыть лаб · ${n} челленджей`;
    } else if (isCalc) {
        const n = getSessionSize(getUnitCalcScenarioCount(), pendingSetup.length || "standard");
        setupStart.disabled = getUnitCalcScenarioCount() === 0;
        setupStart.textContent =
            getUnitCalcScenarioCount() === 0 ? "Нет заданий" : `Начать · ${n} заданий`;
    } else {
        setupStart.disabled = getSetupPool().length === 0;
        setupStart.textContent =
            getSetupPool().length === 0
                ? "Нет вопросов"
                : `Начать · ${getSetupSessionSize()} вопросов`;
    }

    if (quizSetup.classList.contains("hidden")) {
        lockBodyForQuizSetup();
    }
    quizSetup.classList.remove("hidden");
    syncSetupRoute();
}

function renderScenarioOptions(color) {
    if (
        !pendingSetup ||
        pendingSetup.kind !== "topic" ||
        !isInterviewMode(pendingSetup.topic, pendingSetup.mode)
    ) {
        return;
    }

    setupScenarioOptions.innerHTML = INTERVIEW_SCENARIOS.map(
        (s) => `
        <button type="button" class="mode-option-btn${pendingSetup.scenarioId === s.id ? " active" : ""}" data-scenario="${escapeHtml(s.id)}" style="--mode-color: ${color}">
            <span class="mode-option-icon">👤</span>
            <div class="mode-option-body">
                <h3>${escapeHtml(s.title)}</h3>
                <p>${escapeHtml(s.description)}</p>
                <span class="mode-option-count">${escapeHtml(s.respondentPreview)}</span>
            </div>
        </button>
    `
    ).join("");

    setupScenarioOptions.querySelectorAll(".mode-option-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            pendingSetup.scenarioId = btn.dataset.scenario;
            renderQuizSetup();
        });
    });
}

function renderLengthOptions(color) {
    const poolSize = getSetupPool().length;
    setupLengthOptions.innerHTML = SESSION_LENGTHS.map((len) => {
        const size = getSessionSize(poolSize, len.id);
        return `
        <button type="button" class="setup-length-btn${pendingSetup.length === len.id ? " active" : ""}" data-length="${len.id}" style="--setup-color: ${color}">
            <strong>${len.icon} ${len.label}</strong>
            <span>${len.id === "marathon" ? `Все ${size}` : len.description}</span>
        </button>
    `;
    }).join("");

    setupLengthOptions.querySelectorAll(".setup-length-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            pendingSetup.length = btn.dataset.length;
            renderQuizSetup();
        });
    });
}

function getSetupPool() {
    if (!pendingSetup) return [];

    if (pendingSetup.kind === "mistakes") {
        return getMistakeQuestions(pendingSetup.filter);
    }

    if (isCalcMode(pendingSetup.topic, pendingSetup.mode)) {
        return typeof UNIT_CALC_SCENARIOS !== "undefined" ? UNIT_CALC_SCENARIOS : [];
    }

    if (isLabMode(pendingSetup.topic, pendingSetup.mode)) {
        return [];
    }

    let pool = QUESTIONS.filter((q) => q.topic === pendingSetup.topic);
    const cfg = getTopicConfig(pendingSetup.topic);
    if (cfg.modes?.length && pendingSetup.mode) {
        if (isInterviewMode(pendingSetup.topic, pendingSetup.mode)) {
            return [];
        }
        if (isLabMode(pendingSetup.topic, pendingSetup.mode)) {
            return [];
        }
        if (!isQuizModeAll(pendingSetup.topic, pendingSetup.mode)) {
            pool = pool.filter((q) => q.mode === pendingSetup.mode);
        }
    }
    return pool;
}

function getSetupSessionSize() {
    return getSessionSize(getSetupPool().length, pendingSetup?.length || "standard");
}

function buildTopicSetupUrl(topicName, mode, length = "standard") {
    const topicSlug = ROUTE_NAME_TO_TOPIC[topicName];
    if (!topicSlug) return "/";
    const format = getFormatForTopicMode(topicName, mode) || "quiz";
    return buildTrainPath({ format, topicSlug, length });
}

function closeQuizSetup({ resetRoute = true } = {}) {
    const wasOpen = !quizSetup.classList.contains("hidden");
    quizSetup.classList.add("hidden");
    pendingSetup = null;
    if (wasOpen) {
        unlockBodyForQuizSetup();
    }

    if (!resetRoute || isApplyingRoute) return;

    const inSession =
        !quizScreen.classList.contains("hidden") ||
        !resultsScreen.classList.contains("hidden") ||
        (typeof isInterviewActive === "function" && isInterviewActive()) ||
        (typeof isUnitCalcActive === "function" && isUnitCalcActive()) ||
        (typeof isUnitLabActive === "function" && isUnitLabActive());
    if (inSession) return;

    if (!getCurrentUrl().startsWith("/train/")) return;
    const route = parseAppRoute(new URL(location.href));
    if (route?.q || route?.done) return;

    history.replaceState({}, "", "/");
    currentAppUrl = "/";
    trackRouteView(currentAppUrl);
}

function startQuizFromSetup() {
    if (!pendingSetup) return;

    if (
        pendingSetup.kind === "topic" &&
        isInterviewMode(pendingSetup.topic, pendingSetup.mode)
    ) {
        if (!pendingSetup.scenarioId) return;
        const scenarioId = pendingSetup.scenarioId;
        closeQuizSetup({ resetRoute: false });
        startInterview(scenarioId);
        return;
    }

    if (
        pendingSetup.kind === "topic" &&
        isLabMode(pendingSetup.topic, pendingSetup.mode)
    ) {
        closeQuizSetup({ resetRoute: false });
        startUnitLab();
        return;
    }

    if (
        pendingSetup.kind === "topic" &&
        isCalcMode(pendingSetup.topic, pendingSetup.mode)
    ) {
        const length = pendingSetup.length || "standard";
        closeQuizSetup({ resetRoute: false });
        startUnitCalc(length);
        return;
    }

    const pool = getSetupPool();
    if (pool.length === 0) return;

    if (pendingSetup.kind === "topic") {
        const cfg = getTopicConfig(pendingSetup.topic);
        if (cfg.modes?.length && !pendingSetup.mode) return;
        launchQuiz({
            pool,
            topic: pendingSetup.topic,
            mode: pendingSetup.mode,
            length: pendingSetup.length,
            quizType: "topic"
        });
    } else {
        launchQuiz({
            pool,
            topic: pendingSetup.filter === "all" ? "Все темы" : pendingSetup.filter,
            mode: null,
            length: pendingSetup.length,
            quizType: "mistakes",
            mistakeFilter: pendingSetup.filter
        });
    }

    closeQuizSetup({ resetRoute: false });
}

function renderStatsView() {
    const o = getOverview();

    statsHero.innerHTML = `
        <div class="stat-pill">
            <div class="stat-pill-value">${o.todayCount}</div>
            <div class="stat-pill-label">Прохождений сегодня</div>
        </div>
        <div class="stat-pill">
            <div class="stat-pill-value">${o.todayAvg !== null ? o.todayAvg + "%" : "—"}</div>
            <div class="stat-pill-label">Средний % сегодня</div>
        </div>
        <div class="stat-pill">
            <div class="stat-pill-value">${o.bestPercent > 0 ? o.bestPercent + "%" : "—"}</div>
            <div class="stat-pill-label">Лучший результат</div>
        </div>
        <div class="stat-pill">
            <div class="stat-pill-value">${o.streak}</div>
            <div class="stat-pill-label">Серия дней</div>
        </div>
    `;

    if (gradesSection && typeof renderGradesSectionHtml === "function") {
        gradesSection.innerHTML = renderGradesSectionHtml();
        if (typeof bindSkillsTableInteractions === "function") {
            bindSkillsTableInteractions(gradesSection);
        }
        bindPracticeTriggers(gradesSection);
    }

    if (hardestQuestionsSection && typeof renderHardestQuestionsHtml === "function") {
        hardestQuestionsSection.innerHTML = renderHardestQuestionsHtml(10);
        bindPracticeTriggers(hardestQuestionsSection);
    }

    if (interviewHistorySection && typeof renderInterviewHistoryHtml === "function") {
        interviewHistorySection.innerHTML = renderInterviewHistoryHtml();
        interviewHistorySection.querySelectorAll("[data-interview-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (typeof replayInterviewRecord === "function") {
                    replayInterviewRecord(btn.getAttribute("data-interview-id"));
                }
            });
        });
    }

    const activity = getActivityDays(14);
    const maxCount = Math.max(...activity.map((d) => d.count), 1);

    activityChart.innerHTML = activity
        .map((d) => {
            const h = Math.max((d.count / maxCount) * 100, d.count > 0 ? 8 : 2);
            const tip = d.count > 0 ? `${d.count} раз · ср. ${d.avg}%` : "Нет данных";
            return `
            <div class="activity-bar-wrap">
                <div class="activity-bar" style="height: ${h}%" data-tip="${escapeHtml(tip)}"></div>
                <span class="activity-label">${escapeHtml(d.label)}</span>
            </div>
        `;
        })
        .join("");

    const hourly = getTodayHourly();
    if (o.todayCount > 0 && hourly.some((h) => h.count > 0)) {
        todaySection.classList.remove("hidden");
        const maxH = Math.max(...hourly.map((h) => h.count), 1);
        hourlyChart.innerHTML = hourly
            .map((h) => {
                const height = Math.max((h.count / maxH) * 80, h.count > 0 ? 12 : 3);
                return `
                <div class="hourly-bar-wrap">
                    <div class="hourly-bar" style="height: ${height}px" title="${h.count} раз"></div>
                    <span class="hourly-label">${h.hour}</span>
                </div>
            `;
            })
            .join("");
    } else {
        todaySection.classList.add("hidden");
    }

    topicStatsGrid.innerHTML = getTopicStats()
        .map(
            (t) => `
        <div class="topic-stat-card" style="--topic-color: ${t.color}">
            <div class="topic-stat-header">
                <span>${t.icon}</span>
                <h3>${escapeHtml(t.name)}</h3>
            </div>
            <div class="topic-stat-rows">
                <div class="topic-stat-item">
                    <div class="val">${t.count || "—"}</div>
                    <div class="lbl">Попыток</div>
                </div>
                <div class="topic-stat-item">
                    <div class="val">${t.avg !== null ? t.avg + "%" : "—"}</div>
                    <div class="lbl">Средний</div>
                </div>
                <div class="topic-stat-item">
                    <div class="val">${t.best !== null ? t.best + "%" : "—"}</div>
                    <div class="lbl">Лучший</div>
                </div>
            </div>
        </div>
    `
        )
        .join("");

    const recent = getRecentSessions(30);
    if (recent.length === 0) {
        sessionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>Пока нет прохождений. Начните с любой темы!</p>
            </div>
        `;
    } else {
        sessionsList.innerHTML = recent
            .map(
                (s) => `
            <div class="session-row">
                <span class="session-time">${escapeHtml(formatDate(s.date))} ${escapeHtml(formatTime(s.date))}</span>
                <span class="session-topic">${escapeHtml(getSessionTopicLabel(s))}</span>
                <span>${s.score}/${s.total}</span>
                <span class="session-score ${scoreClass(s.percent)}">${s.percent}%</span>
            </div>
        `
            )
            .join("");
    }
}

function renderKnowledgeView(filter = knowledgeFilter) {
    knowledgeFilter = filter;
    const topics = getKnowledgeTopics();

    topicFilters.innerHTML = `
        <button class="filter-chip ${filter === "all" ? "active" : ""}" data-filter="all">Все темы</button>
        ${topics
            .map(
                (t) => `
            <button class="filter-chip ${filter === t.name ? "active" : ""}" data-filter="${escapeHtml(t.name)}" style="--chip-color: ${t.color}">
                ${t.icon} ${escapeHtml(t.name)}
            </button>
        `
            )
            .join("")}
    `;

    topicFilters.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.addEventListener("click", () => renderKnowledgeView(chip.dataset.filter));
    });

    const toShow = filter === "all" ? topics : topics.filter((t) => t.name === filter);

    knowledgeContent.innerHTML = toShow
        .map((topic) => {
            const kb = getKnowledgeForTopic(topic.name);
            if (!kb) return "";

            const resources = kb.resources
                .map(
                    (r) => `
                <a class="resource-card" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">
                    <div class="resource-meta">
                        <span class="resource-type">${escapeHtml(RESOURCE_TYPE_LABELS[r.type] || r.type)}</span>
                        <span class="resource-lang">${r.lang === "ru" ? "RU" : "EN"}</span>
                    </div>
                    <h4 class="resource-title">${escapeHtml(r.title)}</h4>
                    <p class="resource-desc">${escapeHtml(r.description)}</p>
                    <span class="resource-link">Открыть →</span>
                </a>
            `
                )
                .join("");

            return `
            <section class="knowledge-topic-block" id="kb-${topic.id}" style="--topic-color: ${topic.color}">
                <div class="knowledge-topic-header">
                    <span class="topic-icon">${topic.icon}</span>
                    <h3>${escapeHtml(topic.name)}</h3>
                </div>
                <details class="knowledge-summary" open>
                    <summary>📌 Шпаргалка по теме</summary>
                    <pre class="summary-text">${escapeHtml(kb.summary)}</pre>
                </details>
                <h4 class="resources-title">Материалы для изучения</h4>
                <div class="resources-grid">${resources}</div>
            </section>
        `;
        })
        .join("");

    if (filter !== "all") {
        const el = document.getElementById(`kb-${getTopicConfig(filter).id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function navigateWithTransition(updateView) {
    if (!mainEl) {
        updateView();
        return;
    }

    mainEl.classList.remove("is-entering");
    mainEl.classList.add("is-fading");

    window.setTimeout(() => {
        updateView();
        mainEl.classList.remove("is-fading");
        mainEl.classList.add("is-entering");
        window.setTimeout(() => mainEl.classList.remove("is-entering"), 320);
    }, 180);
}

function goHome() {
    const inActiveQuiz = !quizScreen.classList.contains("hidden");
    const inResults = !resultsScreen.classList.contains("hidden");

    if (inActiveQuiz && (answered || currentIndex > 0)) {
        if (!confirm("Выйти на главную? Прогресс этой попытки будет сброшен.")) {
            return;
        }
    }
    if (inActiveQuiz) {
        trackSessionExit("home_button");
    } else if (inResults) {
        clearActiveQuizSession();
        currentSessionEntryRoute = "/";
    }

    if (typeof isInterviewActive === "function" && isInterviewActive()) {
        if (!confirmLeaveInterview()) return;
        closeInterview();
    }

    if (typeof isUnitCalcActive === "function" && isUnitCalcActive()) {
        if (!confirmLeaveUnitCalc()) return;
        closeUnitCalc();
    }

    if (typeof isUnitLabActive === "function" && isUnitLabActive()) {
        if (!confirmLeaveUnitLab()) return;
        closeUnitLab();
    }

    navigateWithTransition(() => {
        showMainView("train");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function openKnowledge(topic) {
    knowledgeFilter = topic || "all";
    showMainView("knowledge");
}

function setNavVisible(visible) {
    document.querySelector(".nav-tabs").classList.toggle("hidden", !visible);
}

function showMainView(view, options = {}) {
    closeQuizSetup();
    if (typeof closeInterview === "function") closeInterview();
    if (typeof closeUnitCalc === "function") closeUnitCalc();
    if (typeof closeUnitLab === "function") closeUnitLab();
    trainView.classList.add("hidden");
    statsView.classList.add("hidden");
    knowledgeView.classList.add("hidden");
    quizScreen.classList.add("hidden");
    resultsScreen.classList.add("hidden");
    document.getElementById("unit-calc-screen")?.classList.add("hidden");
    document.getElementById("unit-lab-screen")?.classList.add("hidden");
    quizScreen?.classList.remove("has-mobile-actions");
    resultsScreen?.classList.remove("has-mobile-actions");
    document.getElementById("interview-debrief-screen")?.classList.remove("has-mobile-actions");
    document.querySelectorAll(".mobile-action-bar").forEach((el) => {
        el.classList.remove("mobile-action-bar");
    });
    setNavVisible(true);

    document.querySelectorAll(".nav-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.view === view);
    });

    if (view === "train") {
        pruneStaleMistakes();
        trainView.classList.remove("hidden");
        renderOverviewStrip();
        renderTopics();
    } else if (view === "stats") {
        // Цель до render — иначе ошибка в статистике глушит reachGoal
        if (typeof trackMetrika === "function") {
            trackMetrika("view_stats");
        }
        statsView.classList.remove("hidden");
        try {
            renderStatsView();
        } catch (err) {
            console.error("renderStatsView failed:", err);
        }
    } else if (view === "knowledge") {
        knowledgeView.classList.remove("hidden");
        renderKnowledgeView(knowledgeFilter);
    }

    if (options.syncRoute !== false) {
        syncUrlForMainView(view, { replace: options.replaceRoute === true });
    }
}

function launchQuiz({ pool, topic, mode, length, quizType, mistakeFilter = "all" }) {
    currentTopic = topic;
    currentTopicMode = mode;
    currentSessionLength = length;
    currentQuizType = quizType;
    currentMistakeFilter = mistakeFilter;
    currentPracticePoolIds =
        quizType === "practice" ? [...new Set(pool.map((q) => Number(q.id)).filter(Number.isFinite))] : null;

    quizQuestions = shuffle(pool).slice(0, getSessionSize(pool.length, length));
    currentIndex = 0;
    score = 0;
    answered = false;
    currentSelectedIndex = null;
    wrongAnswers = [];
    resultsPercentCached = null;
    currentQuizSessionId = createQuizSessionId();

    beginQuizSession({ plannedQuestions: quizQuestions.length });

    if (typeof trackMetrika === "function") {
        trackMetrika("quiz_start", {
            topic: topic || "",
            quiz_type: quizType || "topic",
            mode: mode || "",
            length: length || "standard",
            questions: quizQuestions.length
        });
    }

    trainView.classList.add("hidden");
    statsView.classList.add("hidden");
    knowledgeView.classList.add("hidden");
    resultsScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    setNavVisible(false);

    updateQuizBadge();
    syncActiveQuizUrl({ force: true, track: !isApplyingRoute });
    persistActiveQuizSession({ phase: "quiz" });
    renderQuestion();
}

/**
 * Быстрый раунд по списку questionId (сложные вопросы / пробелы скилов).
 */
function launchPracticeFromIds(questionIds, { label = "Практика", length = "standard" } = {}) {
    const idSet = new Set(
        (questionIds || [])
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id))
    );
    const pool = QUESTIONS.filter((q) => idSet.has(q.id));
    if (!pool.length) {
        alert("Нет вопросов для тренировки по этой выборке.");
        return;
    }
    launchQuiz({
        pool,
        topic: label,
        mode: null,
        length,
        quizType: "practice",
        mistakeFilter: "all"
    });
}

function bindPracticeTriggers(root) {
    if (!root) return;
    root.querySelectorAll("[data-practice-ids]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            let ids = [];
            try {
                ids = JSON.parse(btn.getAttribute("data-practice-ids") || "[]");
            } catch {
                ids = [];
            }
            const label = btn.getAttribute("data-practice-label") || "Практика";
            const length = btn.getAttribute("data-practice-length") || "standard";
            launchPracticeFromIds(ids, { label, length });
        });
    });
}

function updateQuizBadge() {
    if (currentQuizType === "practice") {
        const len =
            currentSessionLength !== "standard"
                ? ` · ${getSessionLengthLabel(currentSessionLength) || currentSessionLength}`
                : "";
        quizTopicBadge.textContent = `🎯 ${currentTopic || "Практика"}${len}`;
        quizTopicBadge.style.borderColor = "#38BDF844";
        return;
    }

    if (currentQuizType === "mistakes") {
        const filterLabel =
            currentMistakeFilter === "all"
                ? "Все темы"
                : currentMistakeFilter;
        const len =
            currentSessionLength !== "standard"
                ? ` · ${getSessionLengthLabel(currentSessionLength) || currentSessionLength}`
                : "";
        quizTopicBadge.textContent = `🔄 Ошибки · ${filterLabel}${len}`;
        quizTopicBadge.style.borderColor = "#EF444444";
        return;
    }

    const cfg = getTopicConfig(currentTopic);
    const modeLabel = currentTopicMode ? getModeLabel(currentTopic, currentTopicMode) : null;
    const len =
        currentSessionLength !== "standard"
            ? ` · ${getSessionLengthLabel(currentSessionLength) || currentSessionLength}`
            : "";
    quizTopicBadge.textContent = modeLabel
        ? `${cfg.icon} ${currentTopic} · ${modeLabel}${len}`
        : `${cfg.icon} ${currentTopic}${len}`;
    quizTopicBadge.style.borderColor = cfg.color + "44";
}

function restartQuiz() {
    if (currentQuizType === "unit-lab") {
        document.getElementById("results-screen")?.classList.add("hidden");
        startUnitLab();
        return;
    }

    if (currentQuizType === "unit-calc") {
        document.getElementById("results-screen")?.classList.add("hidden");
        startUnitCalc(currentSessionLength || "standard");
        return;
    }

    if (currentQuizType === "practice") {
        const ids = Array.isArray(currentPracticePoolIds) && currentPracticePoolIds.length
            ? currentPracticePoolIds
            : quizQuestions.map((q) => q.id);
        const pool = QUESTIONS.filter((q) => ids.includes(q.id));
        if (pool.length === 0) {
            showMainView("stats");
            return;
        }
        launchQuiz({
            pool,
            topic: currentTopic,
            mode: null,
            length: currentSessionLength,
            quizType: "practice"
        });
        return;
    }

    if (currentQuizType === "mistakes") {
        const pool = getMistakeQuestions(currentMistakeFilter);
        if (pool.length === 0) {
            alert("В банке ошибок больше нет вопросов.");
            showMainView("train");
            return;
        }
        launchQuiz({
            pool,
            topic: currentMistakeFilter === "all" ? "Все темы" : currentMistakeFilter,
            mode: null,
            length: currentSessionLength,
            quizType: "mistakes",
            mistakeFilter: currentMistakeFilter
        });
        return;
    }

    let pool = QUESTIONS.filter((q) => q.topic === currentTopic);
    if (currentTopicMode) pool = pool.filter((q) => q.mode === currentTopicMode);
    if (pool.length === 0) {
        alert("В этом формате пока нет вопросов.");
        return;
    }
    launchQuiz({
        pool,
        topic: currentTopic,
        mode: currentTopicMode,
        length: currentSessionLength,
        quizType: "topic"
    });
}

function renderQuestion({ restoreSelectedIndex = null, skipLifecycleView = false } = {}) {
    answered = false;
    currentSelectedIndex = null;
    const q = quizQuestions[currentIndex];
    const total = quizQuestions.length;
    const num = currentIndex + 1;

    quizProgress.textContent = `${num} / ${total}`;
    progressFill.style.width = `${(num / total) * 100}%`;
    questionText.textContent = q.question;

    const labels = ["A", "B", "C", "D"];
    optionsList.innerHTML = q.options
        .map(
            (opt, i) => `
        <button class="option-btn" data-index="${i}">
            <strong>${labels[i]}.</strong> ${escapeHtml(opt)}
        </button>
    `
        )
        .join("");

    optionsList.querySelectorAll(".option-btn").forEach((btn) => {
        btn.addEventListener("click", () => selectAnswer(Number(btn.dataset.index)));
    });

    feedback.classList.remove("visible", "correct", "wrong");
    feedbackActions.classList.add("hidden");
    if (feedbackCheatsheet) {
        feedbackCheatsheet.innerHTML = "";
        feedbackCheatsheet.classList.add("hidden");
    }
    btnNext.classList.add("hidden");

    syncActiveQuizUrl();
    persistActiveQuizSession({ phase: "quiz" });

    const actionsEl = btnNext.closest(".actions");
    if (typeof clearMobileActionBar === "function") {
        clearMobileActionBar(actionsEl);
    } else if (actionsEl) {
        actionsEl.classList.remove("mobile-action-bar");
        quizScreen?.classList.remove("has-mobile-actions");
    }

    if (!skipLifecycleView) {
        trackQuestionView();
    }

    if (restoreSelectedIndex != null && Number.isFinite(restoreSelectedIndex)) {
        revealAnswer(restoreSelectedIndex, { recordOutcome: false });
    }
}

function revealAnswer(selectedIndex, { recordOutcome = true } = {}) {
    const q = quizQuestions[currentIndex];
    const isCorrect = selectedIndex === q.correct;

    answered = true;
    currentSelectedIndex = selectedIndex;

    if (recordOutcome) {
        if (isCorrect) {
            score++;
            clearMistake(q.id);
        } else {
            recordMistake(q);
        }

        if (typeof recordAnswerOutcome === "function") {
            recordAnswerOutcome({
                questionId: q.id,
                correct: isCorrect,
                selectedIndex,
                questionText: q.question,
                selectedText: q.options[selectedIndex],
                correctText: q.options[q.correct],
                topic: q.topic,
                mode: q.mode || currentTopicMode || null,
                quizType: currentQuizType,
                sessionId: currentQuizSessionId
            });
        }

        if (!isCorrect) {
            wrongAnswers.push({
                id: q.id,
                topic: q.topic,
                question: q.question,
                selected: selectedIndex,
                correct: q.correct,
                options: q.options,
                explanation: q.explanation,
                example: q.example
            });
        }
    }

    optionsList.querySelectorAll(".option-btn").forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.correct) btn.classList.add("correct");
        else if (i === selectedIndex) btn.classList.add("wrong");
    });

    feedback.classList.add("visible", isCorrect ? "correct" : "wrong");
    feedbackIcon.textContent = isCorrect ? "✅" : "❌";
    feedbackTitle.textContent = isCorrect ? "Верно!" : "Неверно";
    feedbackExplanation.textContent = q.explanation;
    feedbackExample.textContent = q.example ? `Пример: ${q.example}` : "";

    if (feedbackCheatsheet) {
        if (!isCorrect && typeof formatCheatSheetHtml === "function") {
            feedbackCheatsheet.innerHTML = formatCheatSheetHtml(q.topic, 4);
            feedbackCheatsheet.classList.toggle("hidden", !feedbackCheatsheet.innerHTML.trim());
        } else {
            feedbackCheatsheet.innerHTML = "";
            feedbackCheatsheet.classList.add("hidden");
        }
    }

    if (!isCorrect) {
        feedbackActions.classList.remove("hidden");
    } else {
        feedbackActions.classList.add("hidden");
    }

    btnNext.textContent =
        currentIndex < quizQuestions.length - 1 ? "Следующий вопрос →" : "Результаты →";
    btnNext.classList.remove("hidden");

    persistActiveQuizSession({ phase: "quiz" });

    const actionsEl = btnNext.closest(".actions");
    if (typeof ensurePrimaryActionVisible === "function") {
        ensurePrimaryActionVisible(actionsEl, feedback);
    }
}

function selectAnswer(selectedIndex) {
    if (answered) return;
    revealAnswer(selectedIndex, { recordOutcome: true });
}

function renderMistakesReview() {
    const labels = ["A", "B", "C", "D"];

    if (wrongAnswers.length === 0) {
        resultsMistakes.classList.add("hidden");
        resultsMistakesList.innerHTML = "";
        resultsKnowledge.classList.add("hidden");
        return;
    }

    resultsMistakes.classList.remove("hidden");
    resultsMistakesList.innerHTML = wrongAnswers
        .map((w, i) => {
            const skillIds =
                typeof getSkillsForQuestion === "function" ? getSkillsForQuestion(w.id) : [];
            const skillLabels = skillIds
                .map((id) => (typeof getSkillById === "function" ? getSkillById(id) : null))
                .filter(Boolean)
                .map((s) => s.text)
                .slice(0, 2);
            const cheat =
                typeof formatCheatSheetHtml === "function" ? formatCheatSheetHtml(w.topic, 4) : "";
            return `
        <article class="mistake-item">
            <div class="mistake-header">
                <span class="mistake-num">${i + 1}</span>
                <p class="mistake-question">${escapeHtml(w.question)}</p>
            </div>
            <div class="mistake-body">
                <div class="mistake-answer mistake-answer-wrong">
                    <div class="mistake-label">Ваш ответ</div>
                    <div class="mistake-answer-text"><strong>${labels[w.selected]}.</strong> ${escapeHtml(w.options[w.selected])}</div>
                </div>
                <div class="mistake-answer mistake-answer-correct">
                    <div class="mistake-label">Правильно</div>
                    <div class="mistake-answer-text"><strong>${labels[w.correct]}.</strong> ${escapeHtml(w.options[w.correct])}</div>
                </div>
                <div class="mistake-explanation">${escapeHtml(w.explanation)}</div>
                ${w.example ? `<div class="mistake-example">Пример: ${escapeHtml(w.example)}</div>` : ""}
                ${
                    skillLabels.length
                        ? `<div class="mistake-skills">Скилы: ${skillLabels.map((t) => escapeHtml(t)).join(" · ")}</div>`
                        : ""
                }
                ${cheat}
            </div>
        </article>
    `;
        })
        .join("");

    resultsKnowledge.classList.remove("hidden");
    if (currentQuizType === "mistakes") {
        resultsKnowledgeHint.textContent = `Вы ошиблись в ${wrongAnswers.length} из ${quizQuestions.length} — эти вопросы останутся в банке до правильного ответа.`;
    } else {
        resultsKnowledgeHint.textContent = `Вы ошиблись в ${wrongAnswers.length} из ${quizQuestions.length} вопросов — рекомендуем повторить материалы по теме «${currentTopic}».`;
    }
}

function getResultsTitle() {
    if (currentQuizType === "practice") {
        return currentTopic || "Практика";
    }

    if (currentQuizType === "mistakes") {
        const filterLabel =
            currentMistakeFilter === "all"
                ? "Все темы"
                : currentMistakeFilter;
        return `Работа над ошибками · ${filterLabel}`;
    }

    const modeLabel = currentTopicMode ? getModeLabel(currentTopic, currentTopicMode) : null;
    return modeLabel ? `${currentTopic} · ${modeLabel}` : currentTopic;
}

function updateResultsMistakesButton() {
    const count = getMistakeCount();
    if (count > 0) {
        btnReviewMistakes.classList.remove("hidden");
        btnReviewMistakes.textContent = `🔄 Повторить ошибки (${count})`;
    } else {
        btnReviewMistakes.classList.add("hidden");
    }
}

function openKnowledgeForCurrentQuiz() {
    const inActiveQuiz = !quizScreen.classList.contains("hidden");
    const inResults = !resultsScreen.classList.contains("hidden");
    const filter =
        currentQuizType === "mistakes"
            ? currentMistakeFilter === "all"
                ? "all"
                : currentMistakeFilter
            : currentTopic || "all";

    if (inActiveQuiz) {
        if (answered || currentIndex > 0) {
            if (
                !confirm(
                    "Открыть шпаргалку? Прогресс квиза сохранён — продолжите по ссылке тренировки или через вкладку «Тренировка»."
                )
            ) {
                return;
            }
        }
        persistActiveQuizSession({ phase: "quiz" });
    } else if (inResults) {
        persistActiveQuizSession({ phase: "results", percent: resultsPercentCached });
    }

    knowledgeFilter = filter;
    history.pushState({}, "", "/knowledge");
    currentAppUrl = getCurrentUrl();
    trackRouteView(currentAppUrl);
    showMainView("knowledge", { syncRoute: false });
}

function showResults() {
    const total = quizQuestions.length;
    const percent = Math.round((score / total) * 100);
    resultsPercentCached = percent;

    trackSessionComplete(score, total, percent);
    paintResultsScreen(percent, total, { skipRecord: false });
    syncActiveQuizUrl();
    persistActiveQuizSession({ phase: "results", percent });
}

function paintResultsScreen(percent, total, { skipRecord = false } = {}) {
    if (!skipRecord) {
        recordSession(
            currentQuizType === "mistakes" || currentQuizType === "practice"
                ? currentQuizType === "practice"
                    ? currentTopic || "Практика"
                    : "Ошибки"
                : currentTopic,
            score,
            total,
            currentTopicMode,
            {
                sessionLength: currentSessionLength,
                quizType: currentQuizType,
                sessionId: currentQuizSessionId
            }
        );

        if (typeof recordSessionOutcome === "function") {
            recordSessionOutcome({
                topic:
                    currentQuizType === "mistakes"
                        ? "Ошибки"
                        : currentQuizType === "practice"
                          ? currentTopic || "Практика"
                          : currentTopic,
                mode: currentTopicMode,
                quizType: currentQuizType,
                sessionId: currentQuizSessionId,
                sessionLength: currentSessionLength,
                score,
                total,
                percent
            });
        }
    }

    resultsTopic.textContent = getResultsTitle();
    resultsScore.textContent = `${percent}%`;
    resultsDetail.textContent = `${score} из ${total} правильных`;

    let recommendation;
    if (currentQuizType === "practice") {
        if (percent === 100) {
            recommendation = "Подборка закрыта. Вернитесь к таблице скилов или сложным вопросам.";
        } else if (percent >= 50) {
            recommendation = "Часть вопросов ещё шатается — повторите эту же подборку или откройте шпаргалку.";
        } else {
            recommendation = "Сфокусируйтесь на объяснениях к ошибкам, затем снова «потренировать» эту выборку.";
        }
    } else if (currentQuizType === "mistakes") {
        if (percent === 100) {
            recommendation = "Отлично! Все ошибки в этом раунде исправлены. Проверьте банк — возможно, остались вопросы из других тем.";
        } else if (percent >= 50) {
            recommendation = "Прогресс есть — повторите оставшиеся ошибки через некоторое время.";
        } else {
            recommendation = "Вернитесь к теории по проблемным темам, затем снова пройдите банк ошибок.";
        }
    } else if (percent >= 80) {
        recommendation = "Отлично! Тема усвоена хорошо. Попробуйте другой модуль или пройдите ещё раз для закрепления.";
    } else if (percent >= 50) {
        recommendation = "Есть пробелы — перечитайте объяснения к ошибкам и повторите через некоторое время.";
    } else {
        recommendation = "Стоит вернуться к теории. Обратите внимание на примеры в объяснениях — они помогут запомнить.";
    }

    if (typeof buildLearnNextRecommendation === "function" && typeof renderLearnNextHtml === "function") {
        const learnNext = buildLearnNextRecommendation({
            topic: currentTopic,
            percent,
            wrongAnswers,
            quizType: currentQuizType
        });
        resultsRecommendation.innerHTML = `
            <p class="results-recommendation-lead">${escapeHtml(recommendation)}</p>
            ${renderLearnNextHtml(learnNext)}
        `;
        bindPracticeTriggers(resultsRecommendation);
    } else {
        resultsRecommendation.textContent = recommendation;
    }

    renderMistakesReview();
    updateResultsMistakesButton();

    quizScreen.classList.add("hidden");
    resultsScreen.classList.remove("hidden");
    setNavVisible(false);

    const resultsActions = resultsScreen.querySelector(".results-actions");
    if (typeof ensurePrimaryActionVisible === "function") {
        ensurePrimaryActionVisible(resultsActions, resultsRecommendation || resultsActions);
    }

    ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE;
    requestAnimationFrame(() => {
        ringFill.style.strokeDashoffset =
            RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;
    });

    if (percent >= 80) ringFill.style.stroke = "#10B981";
    else if (percent >= 50) ringFill.style.stroke = "#F59E0B";
    else ringFill.style.stroke = "#EF4444";
}

document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        const url =
            tab.dataset.view === "knowledge"
                ? "/knowledge"
                : tab.dataset.view === "stats"
                  ? "/stats"
                  : "/";
        navigateToUrl(url);
    });
});

btnNext.addEventListener("click", () => {
    if (currentIndex < quizQuestions.length - 1) {
        currentIndex++;
        renderQuestion();
    } else {
        showResults();
    }
});

btnBack.addEventListener("click", () => {
    navigateToUrl("/");
});
btnRestart.addEventListener("click", () => restartQuiz());
btnHome.addEventListener("click", () => navigateToUrl("/"));
btnStudyTopic.addEventListener("click", () => openKnowledgeForCurrentQuiz());
btnStudyAfterResults.addEventListener("click", () => openKnowledgeForCurrentQuiz());
btnReviewMistakes.addEventListener("click", () => openQuizSetupForMistakes());
btnBrand.addEventListener("click", goHome);

quizSetupBackdrop.addEventListener("click", closeQuizSetup);
quizSetupClose.addEventListener("click", closeQuizSetup);
setupStart.addEventListener("click", startQuizFromSetup);

btnClearStats.addEventListener("click", () => {
    if (
        confirm(
            "Удалить всю статистику, журнал ответов, банк ошибок и разборы интервью? Это действие нельзя отменить."
        )
    ) {
        clearStats();
        clearAllMistakes();
        if (typeof clearAnswerLog === "function") clearAnswerLog();
        renderStatsView();
        renderOverviewStrip();
        renderTopics();
    }
});

if (btnExportCsv) {
    btnExportCsv.addEventListener("click", () => {
        if (typeof exportProgressCsv !== "function") return;
        const result = exportProgressCsv();
        btnExportCsv.textContent = `Экспорт ✓ (${result.sessions} сесс.)`;
        setTimeout(() => {
            btnExportCsv.textContent = "Экспорт CSV";
        }, 2000);
    });
}

window.addEventListener("popstate", () => {
    if (!canLeaveCurrentFlow("browser_back")) {
        history.pushState({}, "", currentAppUrl);
        return;
    }
    applyCurrentRoute({ replace: true });
});

window.addEventListener("pagehide", () => {
    const inQuiz = !quizScreen.classList.contains("hidden");
    const inResults = !resultsScreen.classList.contains("hidden");
    if (inQuiz || inResults) {
        persistActiveQuizSession();
    }
    if (inQuiz) {
        trackSessionExit("pagehide", { clearStorage: false });
    }
});

applyCurrentRoute({ replace: true });