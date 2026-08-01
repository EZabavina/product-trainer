const KNOWLEDGE_BASE = {
    "Метрики": {
        summary: `Ключевые формулы и понятия:
• Sticky Factor = DAU / MAU
• CAC = маркетинговые затраты / новые клиенты
• Churn = ушедшие за период / клиенты на начало периода
• LTV ≈ ARPU × Gross Margin / Churn (для подписок)
• NRR = (MRR начало + Expansion − Churn − Contraction) / MRR начало
• North Star Metric — ценность для пользователя; OMTM — фокус команды на текущем этапе
• Vanity metrics (регистрации без активности) не ведут к решениям
• Когортный анализ обязателен — не смешивайте пользователей разных периодов`,
        resources: [
            {
                type: "course",
                lang: "ru",
                title: "Симулятор управления продуктом на основе данных",
                url: "https://gopractice.ru/course/pm/",
                description: "GoPractice — лучший практический курс по продуктовым метрикам, когортам и росту. Симулятор с реальными данными."
            },
            {
                type: "article",
                lang: "ru",
                title: "N-day и Rolling Retention",
                url: "https://gopractice.ru/product/nday-retention-rollling-retention/",
                description: "Разбор Rolling vs Classic Retention — одна из самых частых ошибок продактов."
            },
            {
                type: "article",
                lang: "ru",
                title: "Плечо метрик",
                url: "https://gopractice.ru/product/metrics/",
                description: "Как понять, какая метрика сильнее всего влияет на бизнес-результат."
            },
            {
                type: "guide",
                lang: "en",
                title: "Amplitude — Product Analytics Playbook",
                url: "https://amplitude.com/product-analytics-playbook",
                description: "Системный гайд по продуктовой аналитике: воронки, retention, сегментация."
            },
            {
                type: "article",
                lang: "en",
                title: "Lenny's Newsletter — Metrics",
                url: "https://www.lennysnewsletter.com/",
                description: "Еженедельная рассылка от ex-Airbnb PM — кейсы, метрики, growth от практиков."
            },
            {
                type: "book",
                lang: "en",
                title: "Lean Analytics (Alistair Croll)",
                url: "https://leananalyticsbook.com/",
                description: "Какая метрика важна на каком этапе стартапа. One Metric That Matters."
            }
        ]
    },
    "Финансовая модель": {
        summary: `Финансовая модель продукта

Отчёты и деньги:
• P&L: Revenue − COGS = Gross Profit → − OpEx = Operating Profit → Net Profit (начисления)
• Revenue (выручка) — оборот, top-line; Profit (прибыль) — что осталось после всех расходов, bottom-line
• Cash Flow: реальные поступления/списания. Годовая оплата: CF сразу, в P&L — по месяцам
• Gross Burn = все расходы/мес; Net Burn = расходы − доходы
• Runway = Cash / Net Burn
• Working Capital = текущие активы − текущие пассивы; в SaaS часто авансы клиентов финансируют операционку

Маржа и затраты:
• Gross Margin = (Revenue − COGS) / Revenue; COGS в IT — серверы, эквайринг, саппорт юнита
• Operating Margin = (Revenue − COGS − OpEx) / Revenue
• Contribution Margin = цена − переменные на шт (на покрытие OpEx и прибыль)
• CapEx — активы (амортизируются); OpEx — текущие (S&M, R&D, G&A). Облако клиентов → COGS; стейджинг → OpEx
• Break-even (шт) = Fixed / (Price − Variable); Margin of Safety = выручка − точка безубыточности

Unit-экономика ↔ кэш:
• LTV ≈ ARPU × GM / Churn (или × Lifetime); ориентир LTV/CAC ≥ 3
• CAC ∈ S&M (OpEx). CAC Payback = CAC / (ARPU × GM) — лучше по марже, не по выручке
• LTV/CAC высокий, но Payback 24 мес → CF отрицательный долго: CAC платим сейчас, LTV «на бумаге»
• CLV — LTV с дисконтом денег во времени (строже для финмодели)

SaaS и планирование:
• Magic Number = (ΔMRR за квартал × 4) / S&M прошлого квартала (>0.75 — можно масштабировать)
• Rule of 40: рост выручки % + EBITDA margin % ≥ 40
• EBITDA — прибыль до %, налогов, износа/амортизации
• Bottom-Up: от трафика/конверсии/ARPU; Top-Down: от рынка. Buffer к расходам 10–20%
• Сезонность: коэффициенты на месяцы (напр. дек ×1.5, янв ×0.5) — чтобы ловить кассовые разрывы
• Триал: MRR с оплаты; COGS — с дня старта. Ранний SaaS часто J-Curve: убыток сейчас ради MRR-базы позже
• ROI = (доход − инвестиции) / инвестиции; ROMI — только маркетинг. NPV/IRR — оценка проектов с дисконтом`,
        resources: [
            {
                type: "article",
                lang: "ru",
                title: "Финансовая модель стартапа — видео",
                url: "https://gopractice.ru/free/vid_zabudko_smirnov/",
                description: "GoPractice — как строить финмодель с нуля для продакта."
            },
            {
                type: "guide",
                lang: "en",
                title: "Sequoia — Frameworks for Product Success",
                url: "https://articles.sequoiacap.com/frameworks-for-product-success",
                description: "Фреймворки Sequoia: метрики, рост и финансовое планирование продукта."
            },
            {
                type: "article",
                lang: "en",
                title: "SaaS Metrics 2.0 — David Skok",
                url: "https://www.forentrepreneurs.com/saas-metrics-2/",
                description: "Классика: MRR, CAC, LTV, churn, cohort analysis для SaaS."
            },
            {
                type: "article",
                lang: "en",
                title: "Rule of 40 — Brad Feld",
                url: "https://feld.com/archives/2015/02/rule-40-healthy-saas-company/",
                description: "Баланс роста и прибыльности в зрелом SaaS."
            },
            {
                type: "article",
                lang: "ru",
                title: "Unit-экономика и финмодель — ВШЭ",
                url: "https://online.hse.ru/blog/statyi/perevod-s-professionalnogo/junit-jekonomika-kak-rasschitat-vybrat-metriki-i-uluchshit-pokazateli",
                description: "Связь юнит-экономики с финансовой моделью, формулы на русском."
            },
            {
                type: "book",
                lang: "en",
                title: "Venture Deals (Brad Feld)",
                url: "https://www.venturedeals.com/",
                description: "Как читать term sheets и понимать ожидания инвесторов к финмодели."
            }
        ]
    },
    "Юнит-экономика": {
        summary: `Юнит-экономика отвечает: сходится ли бизнес на одном клиенте?
• LTV = ARPPU × Gross Margin × Lifetime (или / Churn)
• ARPU = ARPPU × Conversion Rate
• LTV/CAC ≥ 3 — здоровый ориентир
• CAC Payback = CAC / (ARPU × Gross Margin) — месяцев до окупаемости
• Считайте по когортам и каналам отдельно — blended CAC врёт
• Freemium: LTV на платящих, CAC — на всех привлечённых
• COGS — переменные затраты на юнит (серверы, эквайринг, доставка)`,
        resources: [
            {
                type: "guide",
                lang: "ru",
                title: "Рабочая модель юнит-экономики (Google Sheets)",
                url: "https://docs.google.com/spreadsheets/d/1SYMuPtRKHAdy4rhL3JYcoMcpH-0QMbqhFTzDwFI2KgY/edit?gid=631121018#gid=631121018",
                description: "Реальный расчёт: LTV, CAC, ARPPU, конверсии, когорты и плечо метрик в таблице."
            },
            {
                type: "article",
                lang: "ru",
                title: "Юнит-экономика — это просто",
                url: "https://gopractice.ru/product/unit-economics/",
                description: "Лучшая статья на русском: LTV vs CPA, когорты, плечо метрик. Must read."
            },
            {
                type: "course",
                lang: "ru",
                title: "Курс «Юнит-экономика» — Яндекс Практикум",
                url: "https://practicum.yandex.ru/unit-economics/",
                description: "Практика в Google Таблицах: модель, плечо метрик, freemium."
            },
            {
                type: "article",
                lang: "ru",
                title: "Юнит-экономика: считаем и применяем",
                url: "https://productstar.ru/blog/unit-ekonomika-schitaem-i-primenyaem",
                description: "ProductStar — CAC, LTV, COGS, маржинальность с примерами."
            },
            {
                type: "article",
                lang: "en",
                title: "Cloud Unit Economics in 2024",
                url: "https://www.onlycfo.io/p/cloud-unit-economics-in-2024",
                description: "OnlyCFO — LTV/CAC, burn multiple, NRR для облачных компаний."
            },
            {
                type: "article",
                lang: "en",
                title: "Andrew Chen — Marketplace Metrics",
                url: "https://andrewchen.com/how-to-build-a-billion-dollar-digital-marketplace-examples-from-uber-ebay-craigslist-and-more/",
                description: "Специфика юнит-экономики маркетплейсов и двусторонних рынков."
            },
            {
                type: "guide",
                lang: "en",
                title: "a16z — 16 Startup Metrics",
                url: "https://a16z.com/16-startup-metrics/",
                description: "16 ключевых метрик стартапа от Andreessen Horowitz."
            }
        ]
    },
    "JTBD": {
        summary: `Jobs-to-be-Done: люди «нанимают» продукт для выполнения работы.
• Job Statement: [Когда…] [я хочу…] [чтобы…]
• Functional / Emotional / Social jobs
• Forces of Progress: Push + Pull > Anxiety + Habit → переключение
• Job Map (Ulwick): Define → Locate → Prepare → Confirm → Execute → Monitor → Modify → Conclude

Switching Interview изучает момент смены решения. Сегментируйте по Job, не по демографии. Конкуренты — все решения одной работы (Uber конкурирует с метро, не только с Lyft).`,
        resources: [
            {
                type: "guide",
                lang: "en",
                title: "Strategyn — What is Jobs-to-be-Done",
                url: "https://strategyn.com/jobs-to-be-done/",
                description: "Введение в JTBD от создателей Outcome-Driven Innovation: работы, outcomes, сегментация."
            },
            {
                type: "article",
                lang: "en",
                title: "Intercom — Job Stories",
                url: "https://www.intercom.com/blog/using-job-stories-design-features-ui-ux/",
                description: "Как применять JTBD в дизайне: job stories вместо user stories."
            },
            {
                type: "article",
                lang: "en",
                title: "JTBD + Unit Economics for SaaS",
                url: "https://www.phoenixstrategy.group/blog/jtbd-framework-for-saas-3-key-lessons",
                description: "Как связать Jobs с P&L и сегментировать метрики по работам."
            },
            {
                type: "book",
                lang: "en",
                title: "Competing Against Luck (Clayton Christensen)",
                url: "https://www.christenseninstitute.org/jobs-to-be-done/",
                description: "Оригинальная теория от автора JTBD. Milkshake case."
            },
            {
                type: "book",
                lang: "en",
                title: "The Jobs To Be Done Playbook (Jim Kalbach)",
                url: "https://www.jimkalbach.com/jobs-to-be-done-playbook/",
                description: "Практическое руководство: job maps, outcomes, приоритизация."
            },
            {
                type: "guide",
                lang: "en",
                title: "Switch Interview — Jim Kalbach",
                url: "https://jimkalbach.com/switch-interview/",
                description: "Метод switching interview: forces of progress, timeline, триггеры смены решения."
            }
        ]
    },
    "CustDev": {
        summary: `Customer Development — валидация до масштабной разработки.
• Problem Interview → Solution Interview → MVP
• The Mom Test: спрашивай о прошлом, не о будущем («купили бы?» — плохой вопрос)
• 5–10 интервью до saturation (Нил Эйзенберг)
• Five Whys — докопаться до корневой проблемы
• Fake Door / Concierge MVP — проверка спроса без кода

Избегайте: продавать идею, интервьюировать друзей не из ЦА, leading questions. Сигнал — деньги и действия в прошлом, не комплименты.`,
        resources: [
            {
                type: "guide",
                lang: "en",
                title: "Y Combinator — How to Talk to Users",
                url: "https://www.ycombinator.com/library/Iq-how-to-talk-to-users",
                description: "Бесплатный гайд YC: как проводить пользовательские интервью."
            },
            {
                type: "book",
                lang: "en",
                title: "The Mom Test (Rob Fitzpatrick)",
                url: "https://momtestbook.com/",
                description: "Библия CustDev-интервью. Короткая, практичная. Must read."
            },
            {
                type: "book",
                lang: "en",
                title: "The Four Steps to the Epiphany (Steve Blank)",
                url: "https://www.steveblank.com/category/customer-development/",
                description: "Оригинал Customer Development. Customer Discovery → Validation."
            },
            {
                type: "article",
                lang: "ru",
                title: "Customer Development (CustDev)",
                url: "https://gopractice.ru/skills/customer-development-custdev/",
                description: "GoPractice — структура интервью, скринер, типичные ошибки."
            },
            {
                type: "article",
                lang: "en",
                title: "First Round — Early-Stage Customer Discovery",
                url: "https://review.firstround.com/how-to-know-if-your-ideas-the-right-one-a-founders-guide-for-successful-early-stage-customer-discovery/",
                description: "Гайд по customer discovery: как проверить идею до масштабирования."
            },
            {
                type: "book",
                lang: "en",
                title: "Continuous Discovery Habits (Teresa Torres)",
                url: "https://www.producttalk.org/continuous-discovery-habits/",
                description: "Еженедельные интервью + opportunity solution tree — для зрелых команд."
            }
        ]
    }
};

const RESOURCE_TYPE_LABELS = {
    book: "📖 Книга",
    article: "📝 Статья",
    course: "🎓 Курс",
    guide: "📋 Гайд",
    video: "▶️ Видео"
};

function getKnowledgeTopics() {
    return getActiveTopics().filter((t) => KNOWLEDGE_BASE[t.name]);
}

function getKnowledgeForTopic(topicName) {
    return KNOWLEDGE_BASE[topicName] || null;
}

/** Все пункты шпаргалки темы (строки с «•»). */
function getAllCheatSheetBullets(topicName) {
    const kb = getKnowledgeForTopic(topicName);
    if (!kb?.summary) return [];
    const lines = kb.summary.split("\n").map((l) => l.trim()).filter(Boolean);
    const bullets = lines
        .filter((l) => l.startsWith("•"))
        .map((l) => l.replace(/^•\s*/, "").trim())
        .filter(Boolean);
    if (bullets.length) return bullets;
    return lines
        .map((l) => l.replace(/^•\s*/, "").trim())
        .filter((l) => l && !l.endsWith(":") && l.length > 8);
}

const CHEAT_STOPWORDS = new Set([
    "как",
    "что",
    "чем",
    "это",
    "для",
    "или",
    "при",
    "все",
    "его",
    "они",
    "она",
    "вам",
    "вас",
    "the",
    "and",
    "with",
    "from",
    "your",
    "есть",
    "если",
    "когда",
    "после",
    "между",
    "также",
    "можно",
    "нужно",
    "почему",
    "какой",
    "какая",
    "какие",
    "такое",
    "такой",
    "является",
    "называется",
    "продукт",
    "продукта",
    "продукте",
    "компании",
    "компания",
    "бизнеса",
    "бизнес",
    "вопрос",
    "ответа",
    "финмодел",
    "финмодели",
    "финмодель",
    "финмоделировании",
    "финмоделирование",
    "модели",
    "модель"
]);

function normalizeCheatQuery(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/p\s*&\s*l/g, " pnl ")
        .replace(/\bcf\b/g, " cashflow ")
        .replace(/cash\s*flow/g, " cashflow ")
        .replace(/ltv\s*\/\s*cac/g, " ltv cac ltv/cac ")
        .replace(/break\s*-?\s*even/g, " breakeven ")
        .replace(/безубыточ\w*/g, " breakeven ")
        .replace(/оборотн\w*\s*капитал\w*/g, " workingcapital ")
        .replace(/working\s*capital/g, " workingcapital ")
        .replace(/сезонност\w*/g, " seasonality ")
        .replace(/[/|,.;:()«»"'′]/g, " ")
        .replace(/-/g, " ");
}

function isCheatStopTerm(term) {
    if (!term || term.length < 3) return true;
    if (CHEAT_STOPWORDS.has(term)) return true;
    if (term.startsWith("финмодел")) return true;
    return false;
}

function hasWholeToken(haystack, token) {
    if (!token) return false;
    const re = new RegExp(`(?:^|\\s)${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`);
    return re.test(haystack);
}

/** Оценка релевантности пункта шпаргалки тексту вопроса. */
function scoreCheatBullet(bullet, queryNorm) {
    if (!queryNorm) return 0;
    const b = normalizeCheatQuery(bullet);
    let score = 0;

    const terms = queryNorm.split(/\s+/).filter((t) => !isCheatStopTerm(t));
    for (const t of terms) {
        // Слишком общие токены — только через keys / marginKinds
        if (t === "margin" || t === "марж" || t === "rate" || t === "cost") continue;
        if (b.includes(t)) score += t.length >= 5 ? 3 : 1;
    }

    const keys = [
        "pnl",
        "cashflow",
        "cogs",
        "ebitda",
        "mrr",
        "arr",
        "arpu",
        "ltv",
        "cac",
        "clv",
        "nrr",
        "roi",
        "romi",
        "npv",
        "irr",
        "runway",
        "burn",
        "payback",
        "breakeven",
        "contribution",
        "amortiz",
        "амортиз",
        "выручк",
        "прибыл",
        "триал",
        "seasonality",
        "инфляц",
        "инвестор",
        "magic",
        "rule of 40",
        "buffer",
        "workingcapital",
        "j curve",
        "jcurve",
        "north star",
        "omtm",
        "vanity",
        "когорт",
        "sticky",
        "dau",
        "mau"
    ];
    for (const k of keys) {
        if (queryNorm.includes(k) && b.includes(k)) score += 5;
    }

    // margin — только вместе с типом, иначе Rule of 40 / чужие margin шумят
    const marginKinds = [
        ["gross margin", "gross margin"],
        ["operating margin", "operating margin"],
        ["contribution margin", "contribution margin"],
        ["валовая марж", "gross margin"],
        ["операционн", "operating margin"],
        ["маржинальн", "contribution margin"]
    ];
    for (const [qPart, bPart] of marginKinds) {
        if (queryNorm.includes(qPart) && b.includes(bPart)) score += 6;
    }

    // CapEx / OpEx: сильный буст только пункту про активы/текущие расходы
    if (hasWholeToken(queryNorm, "capex") && hasWholeToken(b, "capex")) score += 8;
    if (
        hasWholeToken(queryNorm, "opex") &&
        hasWholeToken(b, "opex") &&
        (hasWholeToken(b, "capex") || b.includes("s&m") || b.includes("текущие"))
    ) {
        score += 5;
    }

    return score;
}

/**
 * Короткие пункты шпаргалки.
 * Если передан queryText — только релевантные; при нулевом score ничего не подставляем.
 */
function getCheatSheetBullets(topicName, limit = 5, queryText = "") {
    const all = getAllCheatSheetBullets(topicName);
    if (!all.length) return [];

    const lim = Math.max(1, limit);
    const queryNorm = normalizeCheatQuery(queryText);
    if (!queryNorm.trim()) return all.slice(0, lim);

    const ranked = all
        .map((bullet) => ({ bullet, score: scoreCheatBullet(bullet, queryNorm) }))
        .filter((row) => row.score >= 4)
        .sort((a, b) => b.score - a.score || a.bullet.length - b.bullet.length);

    if (!ranked.length) return [];

    // Если есть явный лидер — не подмешивать слабые соседние совпадения
    const top = ranked[0].score;
    const floor = top >= 10 ? Math.max(4, Math.ceil(top * 0.55)) : 4;
    return ranked
        .filter((row) => row.score >= floor)
        .slice(0, lim)
        .map((row) => row.bullet);
}

function formatCheatSheetHtml(topicName, limit = 3, queryText = "") {
    const bullets = getCheatSheetBullets(topicName, limit, queryText);
    if (!bullets.length) return "";
    return `
        <div class="inline-cheatsheet">
            <div class="inline-cheatsheet-title">Шпаргалка · ${escapeHtml(topicName)}</div>
            <ul class="inline-cheatsheet-list">
                ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
            </ul>
        </div>
    `;
}
