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
 * Делит компетенции на «закрыто» / «пробелы» по лучшему %.
 * Middle.знать ≥50 · Middle.уметь ≥75 · Senior.знать ≥90 · Senior.уметь ≥95
 */
function splitCompetenciesByPercent(topicName, percent) {
    const c = getTopicCompetencies(topicName);
    if (!c) return { known: [], gaps: [] };

    const known = [];
    const gaps = [];
    const p = Number(percent) || 0;

    const push = (list, items, tag) => {
        items.forEach((item) => list.push({ text: item, tag }));
    };

    if (p >= 50) push(known, c.middle.know, "Middle · знать");
    else push(gaps, c.middle.know, "Middle · знать");

    if (p >= 75) push(known, c.middle.can, "Middle · уметь");
    else push(gaps, c.middle.can, "Middle · уметь");

    if (p >= 90) push(known, c.senior.know, "Senior · знать");
    else push(gaps, c.senior.know, "Senior · знать");

    if (p >= 95) push(known, c.senior.can, "Senior · уметь");
    else push(gaps, c.senior.can, "Senior · уметь");

    return { known, gaps };
}

/**
 * Сводка грейдов по темам из статистики квизов (без interview).
 */
function getGradeSnapshots() {
    const sessions = (typeof loadStats === "function" ? loadStats() : { sessions: [] }).sessions;
    const topics = getActiveTopics().filter((t) => TOPIC_COMPETENCIES[t.name]);

    return topics.map((topic) => {
        const topicSessions = sessions.filter(
            (s) =>
                s.topic === topic.name &&
                s.quizType !== "interview" &&
                s.quizType !== "mistakes"
        );
        const best =
            topicSessions.length > 0
                ? Math.max(...topicSessions.map((s) => s.percent))
                : null;
        const last = topicSessions.length > 0 ? topicSessions[topicSessions.length - 1] : null;
        const level = best !== null ? getLevelByPercent(best) : null;
        const split = best !== null ? splitCompetenciesByPercent(topic.name, best) : { known: [], gaps: [] };

        return {
            topic,
            attempts: topicSessions.length,
            bestPercent: best,
            lastPercent: last ? last.percent : null,
            level,
            known: split.known,
            gaps: split.gaps
        };
    });
}

function renderSkillItems(items, emptyText) {
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
        parts.push(`<li>${escapeHtml(item.text)}</li>`);
    });
    if (currentTag !== null) parts.push("</ul>");

    return parts.join("");
}

function renderGradesSectionHtml() {
    const snapshots = getGradeSnapshots();
    const tested = snapshots.filter((s) => s.bestPercent !== null).length;

    const legend = LEVEL_THRESHOLDS.map(
        (l) => `
        <span class="level-legend-item" style="--level-color: ${l.color}">
            <span class="level-legend-dot"></span>
            ${escapeHtml(l.label)} · ${l.minPercent}–${l.maxPercent}%
        </span>
    `
    ).join("");

    if (tested === 0) {
        return `
            <div class="grades-empty">
                <p>Пока нет квизов по темам. Пройдите хотя бы один раунд — здесь появится грейд, % и список «знает / не знает».</p>
                <div class="level-legend">${legend}</div>
            </div>
        `;
    }

    const cards = snapshots
        .map((s) => {
            const hasData = s.bestPercent !== null;
            const levelLabel = hasData ? s.level.label : "Не пройдено";
            const levelColor = hasData ? s.level.color : "#64748B";
            const pct = hasData ? `${s.bestPercent}%` : "—";
            const barWidth = hasData ? s.bestPercent : 0;

            return `
            <article class="grade-card" style="--topic-color: ${s.topic.color}; --level-color: ${levelColor}">
                <div class="grade-card-top">
                    <div class="grade-card-title">
                        <span class="topic-icon">${s.topic.icon}</span>
                        <div>
                            <h3>${escapeHtml(s.topic.name)}</h3>
                            <p class="grade-card-meta">
                                ${
                                    hasData
                                        ? `Лучший результат · ${s.attempts} ${pluralAttempts(s.attempts)}${
                                              s.lastPercent !== null && s.lastPercent !== s.bestPercent
                                                  ? ` · последний ${s.lastPercent}%`
                                                  : ""
                                          }`
                                        : "Ещё не проходили квиз по теме"
                                }
                            </p>
                        </div>
                    </div>
                    <div class="grade-card-score">
                        <span class="grade-badge">${escapeHtml(levelLabel)}</span>
                        <span class="grade-percent">${pct}</span>
                    </div>
                </div>
                <div class="grade-bar" aria-hidden="true">
                    <div class="grade-bar-fill" style="width: ${barWidth}%"></div>
                </div>
                ${
                    hasData
                        ? `<div class="grade-split">
                            <div class="grade-col grade-col-known">
                                <h4 class="grade-col-title">Знает / умеет</h4>
                                ${renderSkillItems(s.known, "Пока рано — закройте базу Middle")}
                            </div>
                            <div class="grade-col grade-col-gaps">
                                <h4 class="grade-col-title">Пробелы</h4>
                                ${renderSkillItems(s.gaps, "Пробелов нет по текущей шкале")}
                            </div>
                        </div>`
                        : ""
                }
            </article>
        `;
        })
        .join("");

    return `
        <div class="grades-intro">
            <p>Грейд считается по <strong>лучшему %</strong> в квизе темы. Шкала: Middle от 50%, Strong Middle от 75%, Senior от 90%.</p>
            <div class="level-legend">${legend}</div>
        </div>
        <div class="grades-list">${cards}</div>
    `;
}

function pluralAttempts(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "попытка";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "попытки";
    return "попыток";
}

function assessTopicLevel(topicName, percent, options = {}) {
    const level = getLevelByPercent(percent);
    const isMistakes = options.quizType === "mistakes";
    const summary = isMistakes
        ? `Раунд по ошибкам. Ориентир: ${level.shortLabel} (${percent}%).`
        : `По теме «${topicName}» ориентир: ${level.shortLabel} (${percent}%).`;

    return { level, topicName, isMistakes, summary };
}
