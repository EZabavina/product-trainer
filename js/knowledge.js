const KNOWLEDGE_BASE = {
    "Метрики": {
        summary: `Ключевые формулы и понятия:
• Sticky Factor = DAU / MAU
• CAC = маркетинговые затраты / новые клиенты
• Churn = ушедшие за период / клиенты на начало периода
• LTV ≈ ARPU × Gross Margin / Churn (для подписок)
• NRR = (MRR начало + Expansion − Churn − Contraction) / MRR начало

North Star Metric отражает ценность для пользователя, OMTM — фокус на текущем этапе. Vanity metrics (регистрации без активности) не ведут к решениям. Когортный анализ обязателен — не смешивайте пользователей разных периодов.`,
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
                title: "Как не надо считать Retention",
                url: "https://gopractice.ru/product/how-to-calculate-retention/",
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
                url: "https://www.oreilly.com/library/view/lean-analytics/9781449335670/",
                description: "Какая метрика важна на каком этапе стартапа. One Metric That Matters."
            }
        ]
    },
    "Финансовая модель": {
        summary: `Основа финмодели продукта:
• Revenue = пользователи × конверсия × ARPU
• Gross Margin = (Revenue − COGS) / Revenue
• Burn Rate = расходы − выручка (Gross/Net burn)
• Runway = Cash / Net Burn (месяцев до нуля)
• Break-even = Fixed Costs / (Price − Variable Cost)

P&L — начисления, Cash Flow — реальные деньги. Rule of 40 (SaaS): рост % + EBITDA margin % ≥ 40. Magic Number = (Net New ARR × 4) / S&M spend — эффективность продаж.`,
        resources: [
            {
                type: "article",
                lang: "ru",
                title: "Финансовая модель стартапа",
                url: "https://gopractice.ru/channels/startup-financial-model/",
                description: "GoPractice — как строить финмодель с нуля для продакта."
            },
            {
                type: "guide",
                lang: "en",
                title: "Sequoia — Financial Models for Startups",
                url: "https://www.sequoiacap.com/article/financial-models/",
                description: "Шаблон и логика финмодели от Sequoia Capital."
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
                url: "https://feld.com/archives/2015/02/the-rule-of-40-for-a-healthy-saas-company/",
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

Считайте по когортам и каналам отдельно — blended CAC врёт. Freemium: LTV считается на платящих, но CAC — на всех привлечённых. COGS — переменные затраты на юнит (серверы, эквайринг, доставка).`,
        resources: [
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
                url: "https://andrewchen.com/marketplace-metrics/",
                description: "Специфика юнит-экономики маркетплейсов и двусторонних рынков."
            },
            {
                type: "guide",
                lang: "en",
                title: "a16z — 16 Startup Metrics",
                url: "https://a16z.com/16-metrics/",
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
                title: "JTBD для стартапов — полный гайд",
                url: "https://www.useresonant.com/blog/jobs-to-be-done-for-startups-guide-2024",
                description: "PMF через JTBD: switching triggers, job success rate, интервью."
            },
            {
                type: "article",
                lang: "en",
                title: "Intercom — Jobs-to-be-Done",
                url: "https://www.intercom.com/blog/jobs-to-be-done/",
                description: "Классическая серия статей Intercom — доступное введение в JTBD."
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
                title: "JTBD.info — Switching Interview",
                url: "https://jtbd.info/",
                description: "Сообщество практиков JTBD: шаблоны интервью, forces diagram."
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
                url: "https://www.ycombinator.com/library/6g-how-to-talk-to-users",
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
                title: "Как проводить CustDev-интервью",
                url: "https://gopractice.ru/product/custdev/",
                description: "GoPractice — структура интервью, скринер, типичные ошибки."
            },
            {
                type: "article",
                lang: "en",
                title: "First Round — 50 Questions to Ask in User Interviews",
                url: "https://review.firstround.com/how-to-conduct-user-interviews",
                description: "50 проверенных вопросов от First Round Capital."
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
