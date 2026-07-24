/**
 * Режим «Расчёты» для Юнит-экономики — мини-калькулятор по сценариям.
 */
let unitCalcActive = false;
let unitCalcQueue = [];
let unitCalcIndex = 0;
let unitCalcScore = 0;
let unitCalcChecked = false;
let unitCalcSessionId = null;
let unitCalcLength = "standard";

const unitCalcScreen = document.getElementById("unit-calc-screen");
const unitCalcBadge = document.getElementById("unit-calc-badge");
const unitCalcProgress = document.getElementById("unit-calc-progress");
const unitCalcFill = document.getElementById("unit-calc-fill");
const unitCalcTitle = document.getElementById("unit-calc-title");
const unitCalcBrief = document.getElementById("unit-calc-brief");
const unitCalcGiven = document.getElementById("unit-calc-given");
const unitCalcAsk = document.getElementById("unit-calc-ask");
const unitCalcFeedback = document.getElementById("unit-calc-feedback");
const unitCalcSheetHint = document.getElementById("unit-calc-sheet-hint");
const btnUnitCalcBack = document.getElementById("unit-calc-back");
const btnUnitCalcCheck = document.getElementById("unit-calc-check");
const btnUnitCalcNext = document.getElementById("unit-calc-next");

function isUnitCalcActive() {
    return unitCalcActive;
}

function getUnitCalcScenarioCount() {
    return typeof UNIT_CALC_SCENARIOS !== "undefined" ? UNIT_CALC_SCENARIOS.length : 0;
}

function parseCalcNumber(raw) {
    if (raw == null) return NaN;
    let s = String(raw).trim().toLowerCase();
    s = s
        .replace(/\s/g, "")
        .replace(/₽|руб\.?|р\./g, "")
        .replace(/%/g, "")
        .replace(",", ".");
    if (!s) return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
}

function numbersMatch(expected, actual) {
    if (!Number.isFinite(actual)) return false;
    const absTol = Math.max(0.05, Math.abs(expected) * 0.02);
    return Math.abs(actual - expected) <= absTol;
}

function formatCalcValue(item) {
    if (item.display) return item.display;
    if (item.unit === "%") return `${Math.round(item.value * 1000) / 10}%`;
    if (Number.isInteger(item.value)) {
        return `${item.value.toLocaleString("ru-RU")}${item.unit ? ` ${item.unit}` : ""}`;
    }
    return `${String(item.value).replace(".", ",")}${item.unit ? ` ${item.unit}` : ""}`;
}

function startUnitCalc(lengthId = "standard") {
    if (!getUnitCalcScenarioCount()) return;

    const all = [...UNIT_CALC_SCENARIOS];
    const size = getSessionSize(all.length, lengthId);
    unitCalcQueue = shuffle(all).slice(0, size);
    unitCalcIndex = 0;
    unitCalcScore = 0;
    unitCalcChecked = false;
    unitCalcLength = lengthId;
    unitCalcSessionId =
        typeof createQuizSessionId === "function"
            ? createQuizSessionId()
            : `uc_${Date.now()}`;
    unitCalcActive = true;

    document.getElementById("train-view")?.classList.add("hidden");
    document.getElementById("stats-view")?.classList.add("hidden");
    document.getElementById("knowledge-view")?.classList.add("hidden");
    document.getElementById("quiz-screen")?.classList.add("hidden");
    document.getElementById("results-screen")?.classList.add("hidden");
    document.getElementById("interview-screen")?.classList.add("hidden");
    document.getElementById("interview-debrief-screen")?.classList.add("hidden");
    unitCalcScreen.classList.remove("hidden");
    document.querySelector(".nav-tabs")?.classList.add("hidden");

    const cfg = getTopicConfig("Юнит-экономика");
    unitCalcBadge.textContent = `${cfg.icon} Юнит-экономика · Расчёты`;
    unitCalcBadge.style.borderColor = cfg.color + "44";

    if (typeof trackMetrika === "function") {
        trackMetrika("unit_calc_start", { questions: unitCalcQueue.length });
    }

    renderUnitCalcTask();
}

function closeUnitCalc() {
    unitCalcActive = false;
    unitCalcQueue = [];
    unitCalcScreen?.classList.add("hidden");
}

function confirmLeaveUnitCalc() {
    if (!unitCalcActive) return true;
    return confirm("Выйти из расчётов? Прогресс раунда не сохранится.");
}

function renderUnitCalcTask() {
    const task = unitCalcQueue[unitCalcIndex];
    if (!task) return;

    unitCalcChecked = false;
    const total = unitCalcQueue.length;
    const n = unitCalcIndex + 1;
    unitCalcProgress.textContent = `${n} / ${total}`;
    if (unitCalcFill) {
        unitCalcFill.style.width = `${((n - 1) / total) * 100}%`;
    }

    unitCalcTitle.textContent = `${task.icon || "🧮"} ${task.title}`;
    unitCalcBrief.textContent = task.brief;
    unitCalcSheetHint.textContent = task.sheetHint
        ? `Как в таблице: ${task.sheetHint}`
        : "";

    unitCalcGiven.innerHTML = task.given
        .map(
            (g) => `
        <div class="uc-metric uc-metric-given">
            <span class="uc-metric-label">${escapeHtml(g.label)}</span>
            <span class="uc-metric-value">${escapeHtml(formatCalcValue(g))}</span>
        </div>`
        )
        .join("");

    unitCalcAsk.innerHTML = task.ask
        .map(
            (a) => `
        <label class="uc-metric uc-metric-ask">
            <span class="uc-metric-label">${escapeHtml(a.label)}</span>
            <input class="uc-input" type="text" inputmode="decimal" data-ask-key="${escapeHtml(a.key)}" placeholder="Ваш ответ" autocomplete="off" />
        </label>`
        )
        .join("");

    unitCalcFeedback.classList.add("hidden");
    unitCalcFeedback.innerHTML = "";
    btnUnitCalcCheck.classList.remove("hidden");
    btnUnitCalcNext.classList.add("hidden");
    btnUnitCalcCheck.disabled = false;

    const firstInput = unitCalcAsk.querySelector(".uc-input");
    firstInput?.focus();
}

function checkUnitCalcAnswers() {
    const task = unitCalcQueue[unitCalcIndex];
    if (!task || unitCalcChecked) return;

    const results = task.ask.map((a) => {
        const input = unitCalcAsk.querySelector(`[data-ask-key="${a.key}"]`);
        const raw = input?.value ?? "";
        const actual = parseCalcNumber(raw);
        const ok = numbersMatch(a.answer, actual);
        if (input) {
            input.classList.toggle("uc-input-ok", ok);
            input.classList.toggle("uc-input-bad", !ok);
            input.disabled = true;
        }
        return { ...a, ok, actual, raw };
    });

    unitCalcChecked = true;
    const allOk = results.every((r) => r.ok);
    if (allOk) unitCalcScore++;

    if (typeof recordAnswerOutcome === "function") {
        recordAnswerOutcome({
            questionId: `unit-calc:${task.id}`,
            correct: allOk,
            selectedIndex: null,
            topic: "Юнит-экономика",
            mode: "calc",
            quizType: "unit-calc",
            sessionId: unitCalcSessionId
        });
    }

    unitCalcFeedback.classList.remove("hidden");
    unitCalcFeedback.classList.toggle("uc-feedback-ok", allOk);
    unitCalcFeedback.classList.toggle("uc-feedback-bad", !allOk);
    unitCalcFeedback.innerHTML = `
        <div class="uc-feedback-title">${allOk ? "✅ Верно" : "❌ Есть ошибки"}</div>
        <ul class="uc-feedback-list">
            ${results
                .map((r) => {
                    const expected =
                        Number.isInteger(r.answer) || Math.abs(r.answer) >= 10
                            ? r.answer.toLocaleString("ru-RU")
                            : String(r.answer).replace(".", ",");
                    return `<li>
                        <strong>${escapeHtml(r.label)}:</strong>
                        ${r.ok ? "ок" : `ваш ответ «${escapeHtml(r.raw || "—")}», верно ${escapeHtml(expected)}`}
                        <div class="uc-formula">${escapeHtml(r.formula)}</div>
                        ${r.hint ? `<div class="uc-hint">${escapeHtml(r.hint)}</div>` : ""}
                    </li>`;
                })
                .join("")}
        </ul>
    `;

    btnUnitCalcCheck.classList.add("hidden");
    btnUnitCalcNext.classList.remove("hidden");
    btnUnitCalcNext.textContent =
        unitCalcIndex < unitCalcQueue.length - 1 ? "Следующее →" : "Результаты →";

    if (unitCalcFill) {
        unitCalcFill.style.width = `${((unitCalcIndex + 1) / unitCalcQueue.length) * 100}%`;
    }
}

function finishUnitCalc() {
    const total = unitCalcQueue.length;
    const percent = total ? Math.round((unitCalcScore / total) * 100) : 0;

    if (typeof currentTopic !== "undefined") {
        currentTopic = "Юнит-экономика";
        currentTopicMode = "calc";
        currentQuizType = "unit-calc";
        currentSessionLength = unitCalcLength;
    }

    recordSession("Юнит-экономика", unitCalcScore, total, "calc", {
        sessionLength: unitCalcLength,
        quizType: "unit-calc",
        sessionId: unitCalcSessionId
    });

    if (typeof recordSessionOutcome === "function") {
        recordSessionOutcome({
            topic: "Юнит-экономика",
            mode: "calc",
            quizType: "unit-calc",
            sessionId: unitCalcSessionId,
            sessionLength: unitCalcLength,
            score: unitCalcScore,
            total,
            percent
        });
    }

    if (typeof trackMetrika === "function") {
        trackMetrika("unit_calc_complete", { percent, score: unitCalcScore, total });
    }

    closeUnitCalc();

    const resultsScreen = document.getElementById("results-screen");
    const resultsTopic = document.getElementById("results-topic");
    const resultsScore = document.getElementById("results-score");
    const resultsDetail = document.getElementById("results-detail");
    const resultsRecommendation = document.getElementById("results-recommendation");
    const resultsMistakes = document.getElementById("results-mistakes");
    const resultsKnowledge = document.getElementById("results-knowledge");
    const ringFill = document.getElementById("ring-fill");

    resultsMistakes?.classList.add("hidden");
    resultsKnowledge?.classList.add("hidden");
    resultsTopic.textContent = "Юнит-экономика · Расчёты";
    resultsScore.textContent = `${percent}%`;
    resultsDetail.textContent = `${unitCalcScore} из ${total} заданий`;

    let rec;
    if (percent >= 80) rec = "Отлично: формулы юнита на месте. Можете усложнять кейсы в квизе.";
    else if (percent >= 50) rec = "База есть. Пересмотрите CAC / ARPU / LTV в шпаргалке и повторите расчёты.";
    else rec = "Начните с Buyers → ARPPU → CAC → ARPU — это каркас таблицы юнит-экономики.";

    if (resultsRecommendation) {
        resultsRecommendation.innerHTML = `<p class="results-recommendation-lead">${escapeHtml(rec)}</p>`;
    }

    resultsScreen.classList.remove("hidden");
    document.querySelector(".nav-tabs")?.classList.add("hidden");

    const RING = 2 * Math.PI * 52;
    if (ringFill) {
        ringFill.style.strokeDashoffset = RING;
        requestAnimationFrame(() => {
            ringFill.style.strokeDashoffset = RING - (percent / 100) * RING;
        });
        ringFill.style.stroke = percent >= 80 ? "#10B981" : percent >= 50 ? "#F59E0B" : "#EF4444";
    }

    const btnReview = document.getElementById("btn-review-mistakes");
    btnReview?.classList.add("hidden");
}

btnUnitCalcCheck?.addEventListener("click", checkUnitCalcAnswers);
btnUnitCalcNext?.addEventListener("click", () => {
    if (!unitCalcChecked) return;
    if (unitCalcIndex < unitCalcQueue.length - 1) {
        unitCalcIndex++;
        renderUnitCalcTask();
    } else {
        finishUnitCalc();
    }
});
btnUnitCalcBack?.addEventListener("click", () => {
    if (!confirmLeaveUnitCalc()) return;
    closeUnitCalc();
    if (typeof showMainView === "function") showMainView("train");
});

unitCalcAsk?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        if (!unitCalcChecked) checkUnitCalcAnswers();
        else btnUnitCalcNext?.click();
    }
});
