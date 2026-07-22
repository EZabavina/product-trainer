let currentTopic = null;
let currentTopicMode = null;
let currentSessionLength = "standard";
let currentQuizSessionId = null;
let currentQuizType = "topic";
let currentMistakeFilter = "all";
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let wrongAnswers = [];

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
const feedbackActions = document.getElementById("feedback-actions");
const btnStudyTopic = document.getElementById("btn-study-topic");
const btnBack = document.getElementById("btn-back");
const btnNext = document.getElementById("btn-next");
const btnRestart = document.getElementById("btn-restart");
const btnHome = document.getElementById("btn-home");
const btnClearStats = document.getElementById("btn-clear-stats");
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

    setupLengthSection.classList.toggle("hidden", isInterview);
    setupScenarioSection.classList.toggle("hidden", !isInterview);

    if (isInterview) {
        setupStart.disabled = !pendingSetup.scenarioId;
        setupStart.textContent = pendingSetup.scenarioId
            ? "Начать интервью"
            : "Выберите сценарий";
    } else {
        setupStart.disabled = getSetupPool().length === 0;
        setupStart.textContent =
            getSetupPool().length === 0
                ? "Нет вопросов"
                : `Начать · ${getSetupSessionSize()} вопросов`;
    }

    quizSetup.classList.remove("hidden");
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

    let pool = QUESTIONS.filter((q) => q.topic === pendingSetup.topic);
    const cfg = getTopicConfig(pendingSetup.topic);
    if (cfg.modes?.length && pendingSetup.mode) {
        if (isInterviewMode(pendingSetup.topic, pendingSetup.mode)) {
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

function closeQuizSetup() {
    quizSetup.classList.add("hidden");
    pendingSetup = null;
}

function startQuizFromSetup() {
    if (!pendingSetup) return;

    if (
        pendingSetup.kind === "topic" &&
        isInterviewMode(pendingSetup.topic, pendingSetup.mode)
    ) {
        if (!pendingSetup.scenarioId) return;
        const scenarioId = pendingSetup.scenarioId;
        closeQuizSetup();
        startInterview(scenarioId);
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

    closeQuizSetup();
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
    }

    if (hardestQuestionsSection && typeof renderHardestQuestionsHtml === "function") {
        hardestQuestionsSection.innerHTML = renderHardestQuestionsHtml(10);
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
    const inActiveQuiz =
        !quizScreen.classList.contains("hidden") && (answered || currentIndex > 0);

    if (inActiveQuiz && !confirm("Выйти на главную? Текущий прогресс квиза не сохранится.")) {
        return;
    }

    if (typeof isInterviewActive === "function" && isInterviewActive()) {
        if (!confirmLeaveInterview()) return;
        closeInterview();
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

function showMainView(view) {
    closeQuizSetup();
    if (typeof closeInterview === "function") closeInterview();
    trainView.classList.add("hidden");
    statsView.classList.add("hidden");
    knowledgeView.classList.add("hidden");
    quizScreen.classList.add("hidden");
    resultsScreen.classList.add("hidden");
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
        statsView.classList.remove("hidden");
        renderStatsView();
        if (typeof trackMetrika === "function") {
            trackMetrika("view_stats");
        }
    } else if (view === "knowledge") {
        knowledgeView.classList.remove("hidden");
        renderKnowledgeView(knowledgeFilter);
    }
}

function launchQuiz({ pool, topic, mode, length, quizType, mistakeFilter = "all" }) {
    currentTopic = topic;
    currentTopicMode = mode;
    currentSessionLength = length;
    currentQuizType = quizType;
    currentMistakeFilter = mistakeFilter;

    quizQuestions = shuffle(pool).slice(0, getSessionSize(pool.length, length));
    currentIndex = 0;
    score = 0;
    answered = false;
    wrongAnswers = [];
    currentQuizSessionId = createQuizSessionId();

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
    resultsScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    setNavVisible(false);

    updateQuizBadge();
    renderQuestion();
}

function updateQuizBadge() {
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

function renderQuestion() {
    answered = false;
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
    btnNext.classList.add("hidden");
}

function selectAnswer(selectedIndex) {
    if (answered) return;
    answered = true;

    const q = quizQuestions[currentIndex];
    const isCorrect = selectedIndex === q.correct;

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
            topic: q.topic,
            mode: q.mode || currentTopicMode || null,
            quizType: currentQuizType,
            sessionId: currentQuizSessionId
        });
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
        feedbackActions.classList.remove("hidden");
    } else {
        feedbackActions.classList.add("hidden");
    }

    btnNext.textContent =
        currentIndex < quizQuestions.length - 1 ? "Следующий вопрос →" : "Результаты →";
    btnNext.classList.remove("hidden");
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
        .map(
            (w, i) => `
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
            </div>
        </article>
    `
        )
        .join("");

    resultsKnowledge.classList.remove("hidden");
    if (currentQuizType === "mistakes") {
        resultsKnowledgeHint.textContent = `Вы ошиблись в ${wrongAnswers.length} из ${quizQuestions.length} — эти вопросы останутся в банке до правильного ответа.`;
    } else {
        resultsKnowledgeHint.textContent = `Вы ошиблись в ${wrongAnswers.length} из ${quizQuestions.length} вопросов — рекомендуем повторить материалы по теме «${currentTopic}».`;
    }
}

function getResultsTitle() {
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
    if (currentQuizType === "mistakes") {
        openKnowledge(currentMistakeFilter === "all" ? "all" : currentMistakeFilter);
    } else {
        openKnowledge(currentTopic);
    }
}

function showResults() {
    const total = quizQuestions.length;
    const percent = Math.round((score / total) * 100);

    recordSession(
        currentQuizType === "mistakes" ? "Ошибки" : currentTopic,
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
            topic: currentQuizType === "mistakes" ? "Ошибки" : currentTopic,
            mode: currentTopicMode,
            quizType: currentQuizType,
            sessionId: currentQuizSessionId,
            sessionLength: currentSessionLength,
            score,
            total,
            percent
        });
    }

    resultsTopic.textContent = getResultsTitle();
    resultsScore.textContent = `${percent}%`;
    resultsDetail.textContent = `${score} из ${total} правильных`;

    let recommendation;
    if (currentQuizType === "mistakes") {
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
    resultsRecommendation.textContent = recommendation;

    renderMistakesReview();
    updateResultsMistakesButton();

    quizScreen.classList.add("hidden");
    resultsScreen.classList.remove("hidden");
    setNavVisible(false);

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
    tab.addEventListener("click", () => showMainView(tab.dataset.view));
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
    if (answered || currentIndex > 0) {
        if (!confirm("Выйти из квиза? Текущий прогресс не сохранится.")) return;
    }
    showMainView("train");
});
btnRestart.addEventListener("click", () => restartQuiz());
btnHome.addEventListener("click", () => showMainView("train"));
btnStudyTopic.addEventListener("click", () => openKnowledgeForCurrentQuiz());
btnStudyAfterResults.addEventListener("click", () => openKnowledgeForCurrentQuiz());
btnReviewMistakes.addEventListener("click", () => openQuizSetupForMistakes());
btnBrand.addEventListener("click", goHome);

quizSetupBackdrop.addEventListener("click", closeQuizSetup);
quizSetupClose.addEventListener("click", closeQuizSetup);
setupStart.addEventListener("click", startQuizFromSetup);

btnClearStats.addEventListener("click", () => {
    if (confirm("Удалить всю статистику, журнал ответов и банк ошибок? Это действие нельзя отменить.")) {
        clearStats();
        clearAllMistakes();
        if (typeof clearAnswerLog === "function") clearAnswerLog();
        renderStatsView();
        renderOverviewStrip();
        renderTopics();
    }
});

showMainView("train");
