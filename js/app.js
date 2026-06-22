let currentTopic = null;
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;

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
const resultsKnowledge = document.getElementById("results-knowledge");
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

let knowledgeFilter = "all";

const RING_CIRCUMFERENCE = 327;
const QUESTIONS_PER_SESSION = 15;

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getQuestionCount(topicName) {
    return QUESTIONS.filter((q) => q.topic === topicName).length;
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
            const miniStat =
                topic.count > 0
                    ? `Ср. ${topic.avg}% · ${topic.count} раз`
                    : "Ещё не проходили";
            const miniClass = topic.count > 0 ? "topic-mini-stat" : "topic-mini-stat empty";

            return `
            <div class="topic-card" data-topic="${escapeHtml(topic.name)}" style="--topic-color: ${topic.color}">
                <div class="topic-card-header">
                    <span class="topic-icon">${topic.icon}</span>
                    <h3>${escapeHtml(topic.name)}</h3>
                </div>
                <p class="topic-desc">${escapeHtml(topic.description)}</p>
                <div class="topic-footer">
                    <span class="topic-count">${getQuestionCount(topic.name)} в базе · ${Math.min(QUESTIONS_PER_SESSION, getQuestionCount(topic.name))} за раунд</span>
                    <span class="${miniClass}">${escapeHtml(miniStat)}</span>
                </div>
            </div>
        `;
        })
        .join("");

    topicsGrid.querySelectorAll(".topic-card").forEach((card) => {
        card.addEventListener("click", () => startQuiz(card.dataset.topic));
    });
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
                <span class="session-topic">${escapeHtml(s.topic)}</span>
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

function openKnowledge(topic) {
    knowledgeFilter = topic || "all";
    showMainView("knowledge");
}

function setNavVisible(visible) {
    document.querySelector(".nav-tabs").classList.toggle("hidden", !visible);
}

function showMainView(view) {
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
        trainView.classList.remove("hidden");
        renderOverviewStrip();
        renderTopics();
    } else if (view === "stats") {
        statsView.classList.remove("hidden");
        renderStatsView();
    } else if (view === "knowledge") {
        knowledgeView.classList.remove("hidden");
        renderKnowledgeView(knowledgeFilter);
    }
}

function startQuiz(topic) {
    currentTopic = topic;
    const topicQuestions = QUESTIONS.filter((q) => q.topic === topic);
    quizQuestions = shuffle(topicQuestions).slice(0, QUESTIONS_PER_SESSION);
    currentIndex = 0;
    score = 0;
    answered = false;

    trainView.classList.add("hidden");
    statsView.classList.add("hidden");
    resultsScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    setNavVisible(false);

    const cfg = getTopicConfig(topic);
    quizTopicBadge.textContent = `${cfg.icon} ${topic}`;
    quizTopicBadge.style.borderColor = cfg.color + "44";

    renderQuestion();
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

    if (isCorrect) score++;

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
        feedbackActions.classList.remove("hidden");
    } else {
        feedbackActions.classList.add("hidden");
    }

    btnNext.textContent =
        currentIndex < quizQuestions.length - 1 ? "Следующий вопрос →" : "Результаты →";
    btnNext.classList.remove("hidden");
}

function showResults() {
    const total = quizQuestions.length;
    const percent = Math.round((score / total) * 100);

    recordSession(currentTopic, score, total);

    resultsTopic.textContent = currentTopic;
    resultsScore.textContent = `${percent}%`;
    resultsDetail.textContent = `${score} из ${total} правильных`;

    let recommendation;
    if (percent >= 80) {
        recommendation = "Отлично! Тема усвоена хорошо. Попробуйте другой модуль или пройдите ещё раз для закрепления.";
    } else if (percent >= 50) {
        recommendation = "Есть пробелы — перечитайте объяснения к ошибкам и повторите через некоторое время.";
    } else {
        recommendation = "Стоит вернуться к теории. Обратите внимание на примеры в объяснениях — они помогут запомнить.";
    }
    resultsRecommendation.textContent = recommendation;

    if (percent < 80) {
        resultsKnowledge.classList.remove("hidden");
    } else {
        resultsKnowledge.classList.add("hidden");
    }

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
btnRestart.addEventListener("click", () => startQuiz(currentTopic));
btnHome.addEventListener("click", () => showMainView("train"));
btnStudyTopic.addEventListener("click", () => openKnowledge(currentTopic));
btnStudyAfterResults.addEventListener("click", () => openKnowledge(currentTopic));

btnClearStats.addEventListener("click", () => {
    if (confirm("Удалить всю статистику? Это действие нельзя отменить.")) {
        clearStats();
        renderStatsView();
        renderOverviewStrip();
        renderTopics();
    }
});

showMainView("train");
