/**
 * Матрица компетенций PM по темам тренажёра.
 * Уровень по квизу — ориентир по одной теме, не грейд целиком.
 */
const LEVEL_THRESHOLDS = [
    {
        id: "below-middle",
        label: "Ниже Middle",
        shortLabel: "ниже Middle",
        minPercent: 0,
        maxPercent: 49,
        color: "#EF4444",
        hint: "Системных пробелов много — сначала закройте базу Middle по этой теме."
    },
    {
        id: "middle",
        label: "Middle",
        shortLabel: "Middle",
        minPercent: 50,
        maxPercent: 74,
        color: "#F59E0B",
        hint: "База Middle есть, но нестабильна. Добейте слабые пункты и кейсы."
    },
    {
        id: "strong-middle",
        label: "Strong Middle",
        shortLabel: "Strong Middle",
        minPercent: 75,
        maxPercent: 89,
        color: "#38BDF8",
        hint: "Уверенный Middle. До Senior не хватает глубины в диагностике и связке метрик с решениями."
    },
    {
        id: "senior",
        label: "Senior по теме",
        shortLabel: "Senior",
        minPercent: 90,
        maxPercent: 100,
        color: "#10B981",
        hint: "По этой теме уровень близок к Senior. Проверьте другие темы и практику на кейсах команды."
    }
];

const TOPIC_COMPETENCIES = {
    Метрики: {
        middle: {
            know: [
                "AARRR / воронка и разница activation vs retention",
                "DAU/WAU/MAU, Sticky Factor, Classic vs Rolling Retention",
                "CAC, Churn, LTV на базовом уровне; vanity vs actionable metrics",
                "North Star Metric и OMTM — зачем их разделяют"
            ],
            can: [
                "Прочитать дашборд и назвать, где проседает продукт",
                "Сравнить две когорты и объяснить разницу простыми словами",
                "Отличить проблему активации от проблемы удержания",
                "Сформулировать гипотезу роста, опираясь на метрику"
            ]
        },
        senior: {
            know: [
                "Когорты, сегменты, leading vs lagging метрики",
                "NRR / GRR, expansion, влияние на unit economics",
                "Как метрики искажаются каналом, сезоном и определением события",
                "Связка NSM → дерево метрик → эксперименты"
            ],
            can: [
                "Собрать систему метрик под этап продукта и стейкхолдеров",
                "Диагностировать «метрика выросла, бизнес — нет»",
                "Поставить эксперимент с критерием успеха и риском для метрик",
                "Спорить данными с маркетингом/финансами без «мнений»"
            ]
        }
    },
    "Финансовая модель": {
        middle: {
            know: [
                "P&L vs Cash Flow: начисления и живые деньги",
                "Revenue drivers: пользователи × конверсия × ARPU",
                "Gross Margin, Burn, Runway, break-even на пальцах",
                "Связь финмодели с прогнозом роста и наймом"
            ],
            can: [
                "Прочитать простую финмодель и найти «рычаги»",
                "Оценить, хватит ли runway на 6–12 месяцев",
                "Объяснить, от чего зависит выручка продукта в модели",
                "Задать правильные вопросы к финмодели CEO/CFO"
            ]
        },
        senior: {
            know: [
                "Сценарии base / optimistic / pessimistic",
                "Rule of 40, Magic Number, payback на уровне компании",
                "Чувствительность модели к churn, CAC и delay выручки",
                "Как продуктовые решения бьют по P&L через 1–2 квартала"
            ],
            can: [
                "Собрать или аудитнуть финмодель продукта/направления",
                "Перевести roadmap в impact на выручку и маржу",
                "Защитить бюджет или kill decision цифрами",
                "Согласовать продуктовые OKR с финансовыми целями"
            ]
        }
    },
    "Юнит-экономика": {
        middle: {
            know: [
                "LTV, CAC, LTV/CAC, payback — формулы и смысл",
                "ARPU / ARPPU, conversion, lifetime / churn",
                "COGS и contribution margin на юнит",
                "Почему blended CAC часто врёт"
            ],
            can: [
                "Посчитать юнит-экономику канала или сегмента «на салфетке»",
                "Сказать, сходится ли юнит при текущих допущениях",
                "Найти главное плечо: CAC, конверсия, retention или ARPU",
                "Не смешивать freemium: LTV платящих vs CAC всех"
            ]
        },
        senior: {
            know: [
                "Когортная и канальная юнит-экономика",
                "Marketplace / двухсторонние рынки: take rate, liquidity",
                "Связь NRR, expansion и LTV",
                "Когда «хороший» LTV/CAC всё равно убивает cash"
            ],
            can: [
                "Пересобрать экономику после изменения цены или пакета",
                "Смоделировать влияние фичи на LTV и payback",
                "Выбрать канал/сегмент для масштабирования или остановки",
                "Согласовать CAC ceiling с финансами и ростом"
            ]
        }
    },
    JTBD: {
        middle: {
            know: [
                "Job Statement: когда / хочу / чтобы",
                "Functional / Emotional / Social jobs",
                "Forces of Progress: push, pull, anxiety, habit",
                "Чем Job отличается от persona и feature request"
            ],
            can: [
                "Сформулировать 2–3 кандидата Job по интервью",
                "Отличить Job от «хотелки» пользователя",
                "Провести простой Switch Interview по таймлайну",
                "Сегментировать по работе, а не только по демографии"
            ]
        },
        senior: {
            know: [
                "Job Map и outcome-driven приоритизация",
                "Конкуренты по Job (включая non-consumption)",
                "Связь Job → ценность → метрика успеха",
                "Ограничения JTBD: когда фреймворк не помогает"
            ],
            can: [
                "Построить opportunity space и выбрать Job для ставки",
                "Перевести Job в решения без feature shopping",
                "Синхронизировать discovery-команды вокруг одной Job",
                "Объяснить инвестору/CEO, какую работу продукт «нанимают» делать"
            ]
        }
    },
    CustDev: {
        middle: {
            know: [
                "Problem vs Solution interview: цели этапов",
                "Mom Test: прошлое и поведение, не гипотезы о будущем",
                "Скринер, saturation, базовые типы bias",
                "Fake Door / Concierge как проверка спроса"
            ],
            can: [
                "Составить гайд и провести 5–8 problem-интервью",
                "Не вести респондента leading-вопросами",
                "Отличить комплимент от сигнала готовности платить",
                "Сформулировать learnings и next experiment после серии"
            ]
        },
        senior: {
            know: [
                "Связка discovery → validation → MVP без «петли мнений»",
                "Continuous discovery в продуктовой команде",
                "Как масштабировать интервью и синтез без потери качества",
                "Когда CustDev уже не нужен и нужен growth experiment"
            ],
            can: [
                "Спроектировать программу discovery под риск гипотезы",
                "Научить команду задавать хорошие вопросы (ревью транскриптов)",
                "Принять go / pivot / kill на данных интервью + поведения",
                "Встроить CustDev в ритуалы команды, а не «разовый проект»"
            ]
        }
    }
};

function getLevelByPercent(percent) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    return (
        LEVEL_THRESHOLDS.find((level) => p >= level.minPercent && p <= level.maxPercent) ||
        LEVEL_THRESHOLDS[0]
    );
}

function getTopicCompetencies(topicName) {
    return TOPIC_COMPETENCIES[topicName] || null;
}

function getAllCompetencyTopics() {
    return Object.keys(TOPIC_COMPETENCIES);
}

/**
 * Делит компетенции на «закрыто» / «пробелы».
 * Если есть ответы по связанным вопросам — по ним;
 * иначе — порог % колонки (Middle знать ≥50 … Senior уметь ≥95).
 */
function splitCompetenciesByPercent(topicName, percent) {
    const items = listCompetenciesForTopic(topicName);
    if (!items.length) return { known: [], gaps: [] };

    const known = [];
    const gaps = [];
    const p = Number(percent) || 0;

    items.forEach((item) => {
        const status = evaluateSkillStatus(item.id, p);
        const row = {
            id: item.id,
            text: item.text,
            tag: item.tag,
            status: status.state,
            evidence: status.evidence,
            source: status.source
        };
        if (status.state === "pass") known.push(row);
        else gaps.push(row);
    });

    return { known, gaps };
}

function listCompetenciesForTopic(topicName) {
    const c = getTopicCompetencies(topicName);
    if (!c) return [];
    const slug = {
        Метрики: "metrics",
        "Финансовая модель": "finmodel",
        "Юнит-экономика": "unit",
        JTBD: "jtbd",
        CustDev: "custdev"
    }[topicName];
    if (!slug) return [];

    const out = [];
    const push = (level, kind, tag, minPercent) => {
        (c[level][kind] || []).forEach((text, index) => {
            out.push({
                id: `${slug}.${level}.${kind}.${index}`,
                text,
                tag,
                level,
                kind,
                minPercent
            });
        });
    };
    push("middle", "know", "Middle · знать", 50);
    push("middle", "can", "Middle · уметь", 75);
    push("senior", "know", "Senior · знать", 90);
    push("senior", "can", "Senior · уметь", 95);
    return out;
}

/**
 * Статус скила: по ответам на привязанные вопросы, иначе по порогу %.
 */
function evaluateSkillStatus(skillId, topicBestPercent) {
    let minPercent = 50;
    if (skillId.includes(".senior.can.")) minPercent = 95;
    else if (skillId.includes(".senior.know.")) minPercent = 90;
    else if (skillId.includes(".middle.can.")) minPercent = 75;

    const qids =
        typeof getQuestionsForSkill === "function" ? getQuestionsForSkill(skillId) : [];
    const outcomeMap =
        typeof getQuestionOutcomeStats === "function"
            ? new Map(getQuestionOutcomeStats().map((r) => [Number(r.questionId), r]))
            : new Map();

    let correct = 0;
    let wrong = 0;
    qids.forEach((qid) => {
        const row = outcomeMap.get(Number(qid));
        if (!row) return;
        correct += row.correct || 0;
        wrong += row.wrong || 0;
    });
    const total = correct + wrong;

    if (total > 0) {
        const rate = correct / total;
        return {
            state: rate >= 0.55 ? "pass" : "fail",
            source: "answers",
            evidence: { correct, wrong, total, rate: Math.round(rate * 100) }
        };
    }

    const p =
        topicBestPercent === null || topicBestPercent === undefined
            ? null
            : Number(topicBestPercent);
    if (p === null) {
        return { state: "empty", source: "none", evidence: null };
    }
    return {
        state: p >= minPercent ? "pass" : "fail",
        source: "threshold",
        evidence: null
    };
}

/**
 * Квиз-сессии по теме (без interview / mistakes).
 */
function getTopicQuizSessions(topicName) {
    const sessions = (typeof loadStats === "function" ? loadStats() : { sessions: [] }).sessions;
    return sessions.filter(
        (s) =>
            s.topic === topicName &&
            s.quizType !== "interview" &&
            s.quizType !== "mistakes" &&
            s.quizType !== "unit-calc" &&
            typeof s.score === "number" &&
            typeof s.total === "number"
    );
}

/**
 * Верные/ошибки из лучшей попытки по теме (+ число попыток).
 */
function getTopicBestAnswerStats(topicName) {
    const topicSessions = getTopicQuizSessions(topicName);
    if (!topicSessions.length) {
        return { correct: 0, wrong: 0, total: 0, attempts: 0, bestPercent: null };
    }

    const best = topicSessions.reduce((a, b) => (b.percent > a.percent ? b : a));
    return {
        correct: best.score || 0,
        wrong: Math.max(0, (best.total || 0) - (best.score || 0)),
        total: best.total || 0,
        attempts: topicSessions.length,
        bestPercent: best.percent
    };
}

/**
 * Общий уровень: средний лучший % по ВСЕМ темам (непройденные = 0%).
 * Так неполный профиль не завышает грейд.
 */
function getOverallProductLevel(snapshots) {
    const list = snapshots || getGradeSnapshots();
    const totalTopics = list.length || 1;
    const tested = list.filter((s) => s.bestPercent !== null);

    const avgPercent = Math.round(
        list.reduce((sum, s) => sum + (s.bestPercent ?? 0), 0) / totalTopics
    );

    let correct = 0;
    let wrong = 0;
    tested.forEach((s) => {
        correct += s.answers?.correct || 0;
        wrong += s.answers?.wrong || 0;
    });

    const complete = tested.length === list.length && list.length > 0;
    const level = tested.length === 0 ? null : getLevelByPercent(avgPercent);

    return {
        tested: tested.length,
        totalTopics: list.length,
        avgPercent: tested.length === 0 ? null : avgPercent,
        level,
        levelLabel: level ? overallLevelLabel(level) : null,
        correct,
        wrong,
        complete
    };
}

function overallLevelLabel(level) {
    if (!level) return "";
    if (level.id === "senior") return "Senior";
    return level.label;
}

const SKILL_COLUMNS = [
    { id: "middle-know", label: "Middle", sub: "знать", minPercent: 50, hint: "база терминов и определений" },
    { id: "middle-can", label: "Middle", sub: "уметь", minPercent: 75, hint: "применение ≈ Strong Middle" },
    { id: "senior-know", label: "Senior", sub: "знать", minPercent: 90, hint: "глубина и система метрик" },
    { id: "senior-can", label: "Senior", sub: "уметь", minPercent: 95, hint: "диагностика и решения" }
];

function skillCellState(bestPercent, minPercent) {
    if (bestPercent === null) return "empty";
    return bestPercent >= minPercent ? "pass" : "fail";
}

function skillColumnTag(col) {
    return `${col.label} · ${col.sub}`;
}

function skillCellStateForColumn(snapshot, col) {
    if (snapshot.bestPercent === null) return "empty";
    const items = [...(snapshot.known || []), ...(snapshot.gaps || [])].filter(
        (item) => item.tag === skillColumnTag(col)
    );
    if (!items.length) return skillCellState(snapshot.bestPercent, col.minPercent);

    // Все скилы колонки: и по ответам, и по порогу %
    const scored = items.filter((item) => item.status === "pass" || item.status === "fail");
    if (!scored.length) return skillCellState(snapshot.bestPercent, col.minPercent);
    const passed = scored.filter((item) => item.status === "pass").length;
    return passed / scored.length >= 0.5 ? "pass" : "fail";
}

function skillsForColumn(snapshot, col) {
    const tag = skillColumnTag(col);
    const pool = [...(snapshot.known || []), ...(snapshot.gaps || [])].filter(
        (item) => item.tag === tag
    );
    return pool.map((item) => {
        const mark = item.status === "pass" ? "✓" : "✗";
        const via =
            item.source === "answers" && item.evidence
                ? ` (${item.evidence.correct}/${item.evidence.total})`
                : "";
        return `${mark} ${item.text}${via}`;
    });
}

/**
 * Сводка грейдов по темам из статистики квизов (без interview).
 */
function getGradeSnapshots() {
    const topics = getActiveTopics().filter((t) => TOPIC_COMPETENCIES[t.name]);

    return topics.map((topic) => {
        const topicSessions = getTopicQuizSessions(topic.name);
        const answers = getTopicBestAnswerStats(topic.name);
        const best = answers.bestPercent;
        const last = topicSessions.length > 0 ? topicSessions[topicSessions.length - 1] : null;
        const level = best !== null ? getLevelByPercent(best) : null;
        const split = best !== null ? splitCompetenciesByPercent(topic.name, best) : { known: [], gaps: [] };

        return {
            topic,
            attempts: answers.attempts,
            bestPercent: best,
            lastPercent: last ? last.percent : null,
            level,
            known: split.known,
            gaps: split.gaps,
            answers
        };
    });
}

function renderSkillItemsList(items, emptyText) {
    if (!items.length) {
        return `<p class="grade-empty">${escapeHtml(emptyText)}</p>`;
    }

    let currentTag = null;
    const parts = [];
    items.forEach((item) => {
        if (item.tag !== currentTag) {
            if (currentTag !== null) parts.push("</ul>");
            currentTag = item.tag;
            parts.push(
                `<p class="level-col-label">${escapeHtml(currentTag)}</p><ul class="level-list grade-skill-list">`
            );
        }
        const via =
            item.source === "answers" && item.evidence
                ? `<span class="skill-evidence"> · ответы ${item.evidence.correct}/${item.evidence.total}</span>`
                : item.source === "threshold"
                  ? `<span class="skill-evidence"> · по порогу %</span>`
                  : "";
        parts.push(`<li>${escapeHtml(item.text)}${via}</li>`);
    });
    if (currentTag !== null) parts.push("</ul>");

    return parts.join("");
}

function renderTopicDetailHtml(s) {
    const hasData = s.bestPercent !== null;
    if (!hasData) {
        return `<p class="grade-empty">Пройдите квиз по теме, чтобы увидеть закрытые скилы и пробелы.</p>`;
    }

    return `
        <div class="grade-split">
            <div class="grade-col grade-col-known">
                <h4 class="grade-col-title">Знает / умеет</h4>
                ${renderSkillItemsList(s.known, "Пока рано — закройте базу Middle")}
            </div>
            <div class="grade-col grade-col-gaps">
                <h4 class="grade-col-title">Пробелы</h4>
                ${renderSkillItemsList(s.gaps, "Пробелов нет по текущей шкале")}
            </div>
        </div>
    `;
}

function renderSkillMatrixHtml(snapshots) {
    const head = SKILL_COLUMNS.map(
        (col) => `
        <th scope="col" class="skills-th-level" title="${escapeHtml(`${col.label} · ${col.sub}: ≥${col.minPercent}% · ${col.hint}`)}">
            <span class="skills-th-main">${escapeHtml(col.label)}</span>
            <span class="skills-th-sub">${escapeHtml(col.sub)} · ≥${col.minPercent}%</span>
        </th>`
    ).join("");

    const body = snapshots
        .map((s) => {
            const hasData = s.bestPercent !== null;
            const answers = s.answers || getTopicBestAnswerStats(s.topic.name);
            const levelLabel = hasData ? s.level.shortLabel : "—";
            const levelColor = hasData ? s.level.color : "#64748B";
            const topicId = s.topic.id || s.topic.name;

            const cells = SKILL_COLUMNS.map((col) => {
                const state = skillCellStateForColumn(s, col);
                if (state === "empty") {
                    return `<td class="skills-cell skills-cell-empty">—</td>`;
                }
                const tipItems = skillsForColumn(s, col);
                const tip =
                    tipItems.slice(0, 4).join(" · ") ||
                    (state === "pass" ? "Порог пройден" : "Пока не закрыто");
                if (state === "pass") {
                    return `<td class="skills-cell skills-cell-pass" title="${escapeHtml(tip)}">
                        <span class="skills-mark skills-mark-pass" aria-label="закрыто">✓</span>
                    </td>`;
                }
                return `<td class="skills-cell skills-cell-fail" title="${escapeHtml(tip)}">
                    <span class="skills-mark skills-mark-fail" aria-label="пробел">✗</span>
                </td>`;
            }).join("");

            return `
            <tr class="skills-row" tabindex="0" role="button" aria-expanded="false" data-topic-id="${escapeHtml(topicId)}" style="--topic-color: ${s.topic.color}; --level-color: ${levelColor}">
                <th scope="row" class="skills-th-topic">
                    <span class="skills-topic-icon">${s.topic.icon}</span>
                    <span class="skills-topic-text">
                        <span class="skills-topic-name">${escapeHtml(s.topic.name)}</span>
                        <span class="skills-topic-level">${escapeHtml(levelLabel)}${hasData ? ` · ${s.bestPercent}%` : ""}</span>
                    </span>
                </th>
                <td class="skills-cell skills-cell-answers">
                    ${
                        hasData
                            ? `<span class="skills-answers-ok">✓ ${answers.correct}</span>
                               <span class="skills-answers-bad">✗ ${answers.wrong}</span>
                               <span class="skills-answers-note">лучшая</span>`
                            : `<span class="skills-answers-empty">нет данных</span>`
                    }
                </td>
                ${cells}
            </tr>
            <tr class="skills-detail-row hidden" data-topic-id="${escapeHtml(topicId)}">
                <td colspan="6" class="skills-detail-cell">
                    ${renderTopicDetailHtml(s)}
                </td>
            </tr>`;
        })
        .join("");

    return `
        <div class="skills-table-wrap">
            <table class="skills-table">
                <thead>
                    <tr>
                        <th scope="col" class="skills-th-topic">Знания</th>
                        <th scope="col" class="skills-th-answers">Лучшая попытка</th>
                        ${head}
                    </tr>
                </thead>
                <tbody>${body}</tbody>
            </table>
        </div>
        <p class="skills-hint">Нажмите на строку темы — откроются закрытые скилы и пробелы.</p>
    `;
}

function renderOverallLevelHtml(overall) {
    if (!overall.level) {
        return `
            <div class="overall-level overall-level-empty">
                <p>Пройдите квиз хотя бы по одной теме — появится ориентир уровня и таблица скилов.</p>
            </div>
        `;
    }

    const status = overall.complete
        ? "профиль полный · все темы учтены"
        : `неполный профиль · непройденные темы считаются как 0%`;

    return `
        <div class="overall-level" style="--level-color: ${overall.level.color}">
            <div class="overall-level-main">
                <p class="overall-level-kicker">${overall.complete ? "Общий уровень продакта" : "Ориентир уровня продакта"}</p>
                <h3 class="overall-level-title">${escapeHtml(overall.levelLabel || overall.level.label)}</h3>
                <p class="overall-level-meta">
                    Средний лучший результат ${overall.avgPercent}% · темы ${overall.tested}/${overall.totalTopics}
                    · ${escapeHtml(status)}
                </p>
            </div>
            <div class="overall-level-stats">
                <div class="overall-stat">
                    <span class="overall-stat-value overall-stat-ok">✓ ${overall.correct}</span>
                    <span class="overall-stat-label">верных (лучшие)</span>
                </div>
                <div class="overall-stat">
                    <span class="overall-stat-value overall-stat-bad">✗ ${overall.wrong}</span>
                    <span class="overall-stat-label">ошибок (лучшие)</span>
                </div>
            </div>
        </div>
    `;
}

function renderSkillsLegendHtml() {
    const gates = SKILL_COLUMNS.map(
        (col) => `
        <span class="level-legend-item" style="--level-color: ${col.minPercent >= 90 ? "#10B981" : col.minPercent >= 75 ? "#38BDF8" : "#F59E0B"}">
            <span class="level-legend-dot"></span>
            ${escapeHtml(col.label)} · ${escapeHtml(col.sub)} ≥${col.minPercent}%
        </span>`
    ).join("");

    const bands = LEVEL_THRESHOLDS.map(
        (l) => `
        <span class="level-legend-item level-legend-band" style="--level-color: ${l.color}">
            <span class="level-legend-dot"></span>
            строка: ${escapeHtml(l.shortLabel)} · ${l.minPercent}–${l.maxPercent}%
        </span>`
    ).join("");

    return `
        <div class="level-legend">
            <p class="level-legend-title">Колонки таблицы (пороги ✓)</p>
            <div class="level-legend-row">${gates}</div>
            <p class="level-legend-title">Подпись строки (уровень по лучшему % темы)</p>
            <div class="level-legend-row">${bands}</div>
        </div>
    `;
}

function renderGradesSectionHtml() {
    const snapshots = getGradeSnapshots();
    const overall = getOverallProductLevel(snapshots);
    const tested = snapshots.filter((s) => s.bestPercent !== null).length;

    if (tested === 0) {
        return `
            ${renderOverallLevelHtml(overall)}
            <div class="grades-empty">
                <p>Пройдите квиз по темам — в таблице появятся ✓/✗ по уровням и счётчики лучшей попытки.</p>
                ${renderSkillsLegendHtml()}
            </div>
            ${renderSkillMatrixHtml(snapshots)}
        `;
    }

    return `
        ${renderOverallLevelHtml(overall)}
        <div class="grades-intro">
            <p>
                Слева — знания по темам, справа — уровни (знать / уметь).
                В ячейках: <strong>✓ закрыто</strong> / <strong>✗ пробел</strong> —
                сначала по ответам на вопросы, привязанные к скилу; если ответов ещё нет — по порогу %.
                Колонка «Лучшая попытка» — верные и ошибки из лучшего квиза темы.
                Общий уровень = среднее лучших % по <strong>всем</strong> темам (непройденные = 0%).
            </p>
            ${renderSkillsLegendHtml()}
        </div>
        ${renderSkillMatrixHtml(snapshots)}
    `;
}

function bindSkillsTableInteractions(root) {
    if (!root) return;

    const toggle = (topicId) => {
        const row = root.querySelector(`.skills-row[data-topic-id="${topicId}"]`);
        const detail = root.querySelector(`.skills-detail-row[data-topic-id="${topicId}"]`);
        if (!row || !detail) return;

        const open = detail.classList.contains("hidden");
        root.querySelectorAll(".skills-detail-row").forEach((el) => el.classList.add("hidden"));
        root.querySelectorAll(".skills-row").forEach((el) => {
            el.classList.remove("is-open");
            el.setAttribute("aria-expanded", "false");
        });

        if (open) {
            detail.classList.remove("hidden");
            row.classList.add("is-open");
            row.setAttribute("aria-expanded", "true");
        }
    };

    root.querySelectorAll(".skills-row[data-topic-id]").forEach((row) => {
        const topicId = row.getAttribute("data-topic-id");
        row.addEventListener("click", () => toggle(topicId));
        row.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(topicId);
            }
        });
    });
}

function assessTopicLevel(topicName, percent, options = {}) {
    const level = getLevelByPercent(percent);
    const isMistakes = options.quizType === "mistakes";
    const summary = isMistakes
        ? `Раунд по ошибкам. Ориентир: ${level.shortLabel} (${percent}%).`
        : `По теме «${topicName}» ориентир: ${level.shortLabel} (${percent}%).`;

    return { level, topicName, isMistakes, summary };
}

/**
 * Подборка «что учить дальше» после раунда.
 */
function buildLearnNextRecommendation({ topic, percent, wrongAnswers = [], quizType }) {
    const skills = [];
    const seen = new Set();

    wrongAnswers.forEach((w) => {
        const ids = typeof getSkillsForQuestion === "function" ? getSkillsForQuestion(w.id) : [];
        ids.forEach((sid) => {
            if (seen.has(sid)) return;
            seen.add(sid);
            const skill = typeof getSkillById === "function" ? getSkillById(sid) : null;
            if (skill) {
                const tag = `${skill.level === "senior" ? "Senior" : "Middle"} · ${
                    skill.kind === "can" ? "уметь" : "знать"
                }`;
                skills.push({ ...skill, tag });
            }
        });
    });

    const topicName = quizType === "mistakes" ? null : topic;
    const split =
        topicName && percent != null
            ? splitCompetenciesByPercent(topicName, percent)
            : { known: [], gaps: [] };

    const gapExtras = (split.gaps || [])
        .filter((g) => !seen.has(g.id))
        .slice(0, 3);

    const focusSkills = [
        ...skills.slice(0, 4),
        ...gapExtras.map((g) => ({ id: g.id, text: g.text, tag: g.tag }))
    ].slice(0, 5);

    const topicsFromWrongs = [...new Set(wrongAnswers.map((w) => w.topic).filter(Boolean))];
    const cheatTopic = topicName || topicsFromWrongs[0] || null;
    const bullets =
        cheatTopic && typeof getCheatSheetBullets === "function"
            ? getCheatSheetBullets(cheatTopic, 4)
            : [];

    let lead;
    if (quizType === "mistakes") {
        lead =
            percent === 100
                ? "Все ошибки в раунде закрыты. Дальше — слабые скилы по таблице или другой теме."
                : "Сфокусируйтесь на скилах ниже — по ним были ошибки в этом раунде.";
    } else if (percent >= 80) {
        lead = "Тема в целом закрыта. Для роста дотяните оставшиеся пробелы Senior.";
    } else if (percent >= 50) {
        lead = "Есть база, но нестабильна. Ниже — что учить в первую очередь.";
    } else {
        lead = "Сначала закройте базу Middle по пунктам ниже, затем повторите квиз.";
    }

    return { lead, focusSkills, bullets, cheatTopic, topicsFromWrongs };
}

function renderLearnNextHtml(rec) {
    if (!rec) return "";
    const skillLis = (rec.focusSkills || [])
        .map(
            (s) =>
                `<li><span class="learn-next-tag">${escapeHtml(s.tag || "")}</span> ${escapeHtml(s.text)}</li>`
        )
        .join("");
    const bulletLis = (rec.bullets || [])
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join("");

    return `
        <div class="learn-next">
            <p class="learn-next-lead">${escapeHtml(rec.lead)}</p>
            ${
                skillLis
                    ? `<h4 class="learn-next-title">Скилы на подтягивание</h4><ul class="learn-next-list">${skillLis}</ul>`
                    : ""
            }
            ${
                bulletLis
                    ? `<h4 class="learn-next-title">Шпаргалка${rec.cheatTopic ? `: ${escapeHtml(rec.cheatTopic)}` : ""}</h4><ul class="learn-next-cheats">${bulletLis}</ul>`
                    : ""
            }
        </div>
    `;
}

