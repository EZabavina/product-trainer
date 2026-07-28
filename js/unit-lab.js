/**
 * Юнит-экономика · Лаб 2.0 — одна связная модель (как строка в Sheets).
 * Меняешь входные → пересчитываются Buyers, ARPPU, CAC, ARPU, LTV/CAC, ROI…
 */
const UNIT_LAB_DEFAULTS = {
    users: 50000,
    c1: 0.1,
    avPrice: 600,
    cogs: 0.05,
    lifetime: 1.2,
    spend: 300000
};

const UNIT_LAB_CHALLENGES = [
    {
        id: "lab1",
        title: "Найдите Buyers",
        prompt: "При текущих Users и C1 чему равны Buyers?",
        metric: "buyers",
        answerFrom: (m) => m.buyers
    },
    {
        id: "lab2",
        title: "ARPPU",
        prompt: "Чему равен ARPPU (маржинальный LTV платящего)?",
        metric: "arppu",
        answerFrom: (m) => m.arppu
    },
    {
        id: "lab3",
        title: "CAC",
        prompt: "Чему равен CAC на платящего?",
        metric: "cac",
        answerFrom: (m) => m.cac
    },
    {
        id: "lab4",
        title: "Снизьте CAC",
        prompt: "Измените Spend или C1 так, чтобы CAC стал ≤ 50 и ниже стартового уровня. Затем введите текущий CAC.",
        metric: "cac",
        answerFrom: (m) => m.cac,
        require: (m) => m.cac <= 50.0001 && m.cac < computeUnitLabModel(UNIT_LAB_DEFAULTS).cac
    },
    {
        id: "lab5",
        title: "LTV/CAC",
        prompt: "Чему равен LTV/CAC при текущей модели?",
        metric: "ltvCac",
        answerFrom: (m) => m.ltvCac
    },
    {
        id: "lab6",
        title: "ROI",
        prompt: "Чему равен ROI привлечения (доля, не %)?",
        metric: "roi",
        answerFrom: (m) => m.roi
    }
];

let unitLabActive = false;
let unitLabInputs = { ...UNIT_LAB_DEFAULTS };
let unitLabChallengeIndex = 0;
let unitLabScore = 0;
let unitLabChecked = false;
let unitLabSessionId = null;

const unitLabScreen = document.getElementById("unit-lab-screen");
const unitLabBadge = document.getElementById("unit-lab-badge");
const unitLabInputsEl = document.getElementById("unit-lab-inputs");
const unitLabOutputsEl = document.getElementById("unit-lab-outputs");
const unitLabChallenge = document.getElementById("unit-lab-challenge");
const unitLabProgress = document.getElementById("unit-lab-progress");
const btnUnitLabBack = document.getElementById("unit-lab-back");
const btnUnitLabReset = document.getElementById("unit-lab-reset");
const btnUnitLabCheck = document.getElementById("unit-lab-check");
const btnUnitLabNext = document.getElementById("unit-lab-next");

function isUnitLabActive() {
    return unitLabActive;
}

function getUnitLabChallengeCount() {
    return UNIT_LAB_CHALLENGES.length;
}

function computeUnitLabModel(inp) {
    const users = Number(inp.users) || 0;
    const c1 = Number(inp.c1) || 0;
    const avPrice = Number(inp.avPrice) || 0;
    const cogs = Number(inp.cogs) || 0;
    const lifetime = Number(inp.lifetime) || 0;
    const spend = Number(inp.spend) || 0;

    const buyers = users * c1;
    const arppu = avPrice * (1 - cogs) * lifetime;
    const cac = buyers > 0 ? spend / buyers : 0;
    const cpa = users > 0 ? spend / users : 0;
    const arpu = arppu * c1;
    const ltvCac = cac > 0 ? arppu / cac : 0;
    const unitPayer = arppu - cac;
    const unitAcquired = arpu - cpa;
    const grossProfit = buyers * arppu;
    const netAfterAcq = grossProfit - spend;
    const roi = spend > 0 ? netAfterAcq / spend : 0;

    return {
        users,
        c1,
        avPrice,
        cogs,
        lifetime,
        spend,
        buyers,
        arppu,
        cac,
        cpa,
        arpu,
        ltvCac,
        unitPayer,
        unitAcquired,
        grossProfit,
        netAfterAcq,
        roi
    };
}

function formatLabNum(n, kind = "num") {
    if (!Number.isFinite(n)) return "—";
    if (kind === "pct") return `${(Math.round(n * 1000) / 10).toLocaleString("ru-RU")}%`;
    if (kind === "ratio") return (Math.round(n * 100) / 100).toLocaleString("ru-RU");
    if (Math.abs(n) >= 100 || Number.isInteger(n)) return Math.round(n).toLocaleString("ru-RU");
    return (Math.round(n * 100) / 100).toLocaleString("ru-RU");
}

function startUnitLab() {
    if (typeof enterActiveSession === "function") enterActiveSession();
    unitLabInputs = { ...UNIT_LAB_DEFAULTS };
    unitLabChallengeIndex = 0;
    unitLabScore = 0;
    unitLabChecked = false;
    unitLabSessionId =
        typeof createQuizSessionId === "function" ? createQuizSessionId() : `ul_${Date.now()}`;
    unitLabActive = true;

    [
        "train-view",
        "stats-view",
        "knowledge-view",
        "quiz-screen",
        "results-screen",
        "interview-screen",
        "interview-debrief-screen",
        "unit-calc-screen"
    ].forEach((id) => document.getElementById(id)?.classList.add("hidden"));

    unitLabScreen?.classList.remove("hidden");
    document.querySelector(".nav-tabs")?.classList.add("hidden");

    const cfg = getTopicConfig("Юнит-экономика");
    if (unitLabBadge) {
        unitLabBadge.textContent = `${cfg.icon} Юнит-экономика · Лаб`;
        unitLabBadge.style.borderColor = cfg.color + "44";
    }

    if (typeof trackMetrika === "function") {
        trackMetrika("unit_lab_start");
    }

    renderUnitLab();
}

function closeUnitLab() {
    unitLabActive = false;
    unitLabScreen?.classList.add("hidden");
    const actionsEl = unitLabScreen?.querySelector(".ul-actions");
    if (typeof clearMobileActionBar === "function") {
        clearMobileActionBar(actionsEl);
    } else {
        unitLabScreen?.classList.remove("has-mobile-actions");
        actionsEl?.classList.remove("mobile-action-bar");
    }
}

function confirmLeaveUnitLab() {
    if (!unitLabActive) return true;
    return confirm("Выйти из лаба? Прогресс челленджей не сохранится.");
}

function renderUnitLab() {
    const model = computeUnitLabModel(unitLabInputs);
    renderUnitLabInputs();
    renderUnitLabOutputs(model);
    renderUnitLabChallenge(model);
}

function renderUnitLabInputs() {
    if (!unitLabInputsEl) return;
    const fields = [
        { key: "users", label: "Users", kind: "num" },
        { key: "c1", label: "C1", kind: "pct" },
        { key: "avPrice", label: "AvPrice, ₽", kind: "num" },
        { key: "cogs", label: "COGS", kind: "pct" },
        { key: "lifetime", label: "Lifetime", kind: "num" },
        { key: "spend", label: "Spend, ₽", kind: "num" }
    ];

    unitLabInputsEl.innerHTML = fields
        .map((f) => {
            const raw = unitLabInputs[f.key];
            const shown =
                f.kind === "pct" ? String(Math.round(raw * 1000) / 10).replace(".", ",") : String(raw);
            return `
            <label class="ul-field">
                <span class="ul-field-label">${escapeHtml(f.label)}</span>
                <input class="ul-input" data-lab-key="${f.key}" data-lab-kind="${f.kind}" value="${escapeHtml(shown)}" inputmode="decimal" />
            </label>`;
        })
        .join("");
}

function renderUnitLabOutputs(model) {
    if (!unitLabOutputsEl) return;
    const rows = [
        { label: "Buyers", value: formatLabNum(model.buyers) },
        { label: "ARPPU", value: `${formatLabNum(model.arppu)} ₽` },
        { label: "CAC", value: `${formatLabNum(model.cac)} ₽` },
        { label: "CPA", value: `${formatLabNum(model.cpa)} ₽` },
        { label: "ARPU", value: `${formatLabNum(model.arpu)} ₽` },
        { label: "LTV/CAC", value: formatLabNum(model.ltvCac, "ratio") },
        { label: "Unit (payer)", value: `${formatLabNum(model.unitPayer)} ₽` },
        { label: "Unit (acquired)", value: `${formatLabNum(model.unitAcquired)} ₽` },
        { label: "Gross Profit", value: `${formatLabNum(model.grossProfit)} ₽` },
        { label: "ROI", value: formatLabNum(model.roi, "ratio") }
    ];

    unitLabOutputsEl.innerHTML = rows
        .map(
            (r) => `
        <div class="ul-out">
            <span class="ul-out-label">${escapeHtml(r.label)}</span>
            <span class="ul-out-value">${escapeHtml(r.value)}</span>
        </div>`
        )
        .join("");
}

function renderUnitLabChallenge(model) {
    if (!unitLabChallenge) return;
    const ch = UNIT_LAB_CHALLENGES[unitLabChallengeIndex];
    const total = UNIT_LAB_CHALLENGES.length;
    if (unitLabProgress) {
        unitLabProgress.textContent = `Челлендж ${unitLabChallengeIndex + 1} / ${total}`;
    }

    if (!ch) {
        unitLabChallenge.innerHTML = `<p class="ul-done">Все челленджи пройдены.</p>`;
        btnUnitLabCheck?.classList.add("hidden");
        btnUnitLabNext?.classList.remove("hidden");
        if (btnUnitLabNext) btnUnitLabNext.textContent = "Результаты →";
        return;
    }

    unitLabChecked = false;
    const gate =
        typeof ch.require === "function" && !ch.require(model)
            ? `<p class="ul-gate">Сначала выполните условие в модели слева, затем введите ответ.</p>`
            : "";

    unitLabChallenge.innerHTML = `
        <h3 class="ul-ch-title">${escapeHtml(ch.title)}</h3>
        <p class="ul-ch-prompt">${escapeHtml(ch.prompt)}</p>
        ${gate}
        <label class="ul-field">
            <span class="ul-field-label">${escapeHtml(ch.metric.toUpperCase())}</span>
            <input class="ul-input" id="unit-lab-answer" inputmode="decimal" placeholder="Ваш ответ" autocomplete="off" />
        </label>
        <div class="ul-ch-feedback hidden" id="unit-lab-feedback"></div>
    `;

    btnUnitLabCheck?.classList.remove("hidden");
    btnUnitLabNext?.classList.add("hidden");
    document.getElementById("unit-lab-answer")?.focus();

    const actionsEl = document.querySelector("#unit-lab-screen .ul-actions");
    if (typeof ensurePrimaryActionVisible === "function") {
        ensurePrimaryActionVisible(actionsEl, null, { scroll: false });
    }
}

function onUnitLabInputChange(e) {
    const input = e.target.closest("[data-lab-key]");
    if (!input) return;
    const key = input.dataset.labKey;
    const kind = input.dataset.labKind;
    let n = parseCalcNumber(input.value);
    if (!Number.isFinite(n)) return;
    if (kind === "pct") n = n / 100;
    unitLabInputs[key] = n;
    const model = computeUnitLabModel(unitLabInputs);
    renderUnitLabOutputs(model);
    // refresh gate message without wiping answer
    const ch = UNIT_LAB_CHALLENGES[unitLabChallengeIndex];
    const gateEl = unitLabChallenge?.querySelector(".ul-gate");
    if (ch && typeof ch.require === "function") {
        if (!ch.require(model) && !gateEl) {
            renderUnitLabChallenge(model);
        } else if (ch.require(model) && gateEl) {
            gateEl.remove();
        }
    }
}

function checkUnitLabChallenge() {
    const ch = UNIT_LAB_CHALLENGES[unitLabChallengeIndex];
    if (!ch || unitLabChecked) return;
    const model = computeUnitLabModel(unitLabInputs);
    if (typeof ch.require === "function" && !ch.require(model)) {
        const fb = document.getElementById("unit-lab-feedback");
        if (fb) {
            fb.classList.remove("hidden");
            fb.className = "ul-ch-feedback ul-ch-bad";
            fb.textContent = "Условие в модели ещё не выполнено.";
        }
        return;
    }

    const input = document.getElementById("unit-lab-answer");
    const actual = parseCalcNumber(input?.value);
    const expected = ch.answerFrom(model);
    const ok = numbersMatch(expected, actual);
    unitLabChecked = true;
    if (ok) unitLabScore++;

    if (typeof recordAnswerOutcome === "function") {
        recordAnswerOutcome({
            questionId: `unit-lab:${ch.id}`,
            correct: ok,
            questionText: ch.prompt ? `${ch.title}: ${ch.prompt}` : ch.title,
            selectedText: input?.value?.trim() || "",
            correctText: formatLabNum(
                expected,
                ch.metric === "roi" || ch.metric === "ltvCac" ? "ratio" : "num"
            ),
            topic: "Юнит-экономика",
            mode: "lab",
            quizType: "unit-lab",
            sessionId: unitLabSessionId
        });
    }

    const fb = document.getElementById("unit-lab-feedback");
    if (fb) {
        fb.classList.remove("hidden");
        fb.className = `ul-ch-feedback ${ok ? "ul-ch-ok" : "ul-ch-bad"}`;
        fb.textContent = ok
            ? "✅ Верно"
            : `❌ Верно ≈ ${formatLabNum(expected, ch.metric === "roi" || ch.metric === "ltvCac" ? "ratio" : "num")}`;
    }
    if (input) input.disabled = true;
    btnUnitLabCheck?.classList.add("hidden");
    btnUnitLabNext?.classList.remove("hidden");
    if (btnUnitLabNext) {
        btnUnitLabNext.textContent =
            unitLabChallengeIndex < UNIT_LAB_CHALLENGES.length - 1
                ? "Следующий челлендж →"
                : "Результаты →";
    }

    const actionsEl = document.querySelector("#unit-lab-screen .ul-actions");
    if (typeof ensurePrimaryActionVisible === "function") {
        ensurePrimaryActionVisible(actionsEl, fb || actionsEl);
    }
}

function finishUnitLab() {
    const total = UNIT_LAB_CHALLENGES.length;
    const percent = total ? Math.round((unitLabScore / total) * 100) : 0;

    if (typeof currentTopic !== "undefined") {
        currentTopic = "Юнит-экономика";
        currentTopicMode = "lab";
        currentQuizType = "unit-lab";
        currentSessionLength = "standard";
    }

    if (typeof recordSession === "function") {
        recordSession("Юнит-экономика", unitLabScore, total, "lab", {
            quizType: "unit-lab",
            sessionId: unitLabSessionId
        });
    }
    if (typeof recordSessionOutcome === "function") {
        recordSessionOutcome({
            topic: "Юнит-экономика",
            mode: "lab",
            quizType: "unit-lab",
            sessionId: unitLabSessionId,
            score: unitLabScore,
            total,
            percent
        });
    }
    if (typeof trackMetrika === "function") {
        trackMetrika("unit_lab_complete", { percent, score: unitLabScore, total });
    }

    closeUnitLab();

    const resultsScreen = document.getElementById("results-screen");
    document.getElementById("results-mistakes")?.classList.add("hidden");
    document.getElementById("results-knowledge")?.classList.add("hidden");
    document.getElementById("results-topic").textContent = "Юнит-экономика · Лаб";
    document.getElementById("results-score").textContent = `${percent}%`;
    document.getElementById("results-detail").textContent = `${unitLabScore} из ${total} челленджей`;
    const rec = document.getElementById("results-recommendation");
    if (rec) {
        rec.innerHTML = `<p class="results-recommendation-lead">${escapeHtml(
            percent >= 80
                ? "Модель под контролем: вы связали входы и выходы как в таблице."
                : "Крутите рычаги Users / C1 / Spend / AvPrice и смотрите, что происходит с CAC и ROI."
        )}</p>`;
    }
    resultsScreen?.classList.remove("hidden");
    document.querySelector(".nav-tabs")?.classList.add("hidden");
    document.getElementById("btn-review-mistakes")?.classList.add("hidden");

    const ringFill = document.getElementById("ring-fill");
    const RING = 2 * Math.PI * 52;
    if (ringFill) {
        ringFill.style.strokeDashoffset = RING;
        requestAnimationFrame(() => {
            ringFill.style.strokeDashoffset = RING - (percent / 100) * RING;
        });
        ringFill.style.stroke = percent >= 80 ? "#10B981" : percent >= 50 ? "#F59E0B" : "#EF4444";
    }

    const resultsActions = resultsScreen?.querySelector(".results-actions");
    if (typeof ensurePrimaryActionVisible === "function") {
        ensurePrimaryActionVisible(resultsActions, rec || resultsActions);
    }
}

btnUnitLabBack?.addEventListener("click", () => {
    if (!confirmLeaveUnitLab()) return;
    closeUnitLab();
    if (typeof showMainView === "function") showMainView("train");
});
btnUnitLabReset?.addEventListener("click", () => {
    unitLabInputs = { ...UNIT_LAB_DEFAULTS };
    renderUnitLab();
});
btnUnitLabCheck?.addEventListener("click", checkUnitLabChallenge);
btnUnitLabNext?.addEventListener("click", () => {
    if (!unitLabChecked && unitLabChallengeIndex < UNIT_LAB_CHALLENGES.length) return;
    if (unitLabChallengeIndex < UNIT_LAB_CHALLENGES.length - 1) {
        unitLabChallengeIndex++;
        renderUnitLabChallenge(computeUnitLabModel(unitLabInputs));
    } else {
        finishUnitLab();
    }
});
unitLabInputsEl?.addEventListener("input", onUnitLabInputChange);
unitLabChallenge?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        if (!unitLabChecked) checkUnitLabChallenge();
        else btnUnitLabNext?.click();
    }
});
